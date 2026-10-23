import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';

import { lastDoneLabel } from '../src/lib/date';
import { matchRecipe } from '../src/lib/kitchen';
import type { Recipe } from '../src/lib/types';
import { useStore } from '../src/state/store';
import { colors, font, radius } from '../src/theme';
import { Btn, Card, Chip, IconBtn, Press, Row, Screen, Spacer, T, tap } from '../src/ui/base';
import { RecipeBookArt } from '../src/ui/Art';
import { CookTime, DaySheet, EffortMeter } from '../src/ui/Kitchen';
import { KitchenTabs } from '../src/ui/KitchenTabs';
import { Toast } from '../src/ui/TaskRow';

type Filter = 'all' | 'starred' | 'quick';

/**
 * The recipe book: everything you know how to cook, written down once and
 * reused — ingredients with the steps or a link. From here a dish goes on the
 * shopping list (what's missing, and it gets starred so the planner suggests
 * it) or straight into "Let's cook it" (app/cook.tsx).
 */
export default function RecipeBook() {
  const router = useRouter();

  const recipes = useStore((s) => s.recipes);
  const pantry = useStore((s) => s.pantry);
  const mealPlan = useStore((s) => s.mealPlan);
  const toggleWanted = useStore((s) => s.toggleWanted);
  const recipeToList = useStore((s) => s.recipeToList);
  const planMeal = useStore((s) => s.planMeal);
  const byDay = useStore((s) => !!s.settings.cookByDay);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [planning, setPlanning] = useState<Recipe | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function say(text: string) {
    setToast(text);
    setTimeout(() => setToast(null), 2600);
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...recipes]
      .filter((r) => filter !== 'starred' || r.wanted)
      .filter((r) => filter !== 'quick' || r.effort === 1 || (r.minutes ?? 999) <= 30)
      .filter(
        (r) =>
          !q ||
          r.name.toLowerCase().includes(q) ||
          r.ingredients.some((i) => i.toLowerCase().includes(q)),
      )
      .sort((a, b) => {
        if (!!a.wanted !== !!b.wanted) return a.wanted ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [recipes, query, filter]);

  function renderCard(r: Recipe) {
    const n = r.ingredients.length;
    const m = matchRecipe(r, pantry);
    const hasSteps = !!r.steps?.trim();
    const planned = mealPlan.filter((p) => p.recipeId === r.id).length;

    return (
      <Card key={r.id} style={{ padding: 14, marginBottom: 10 }}>
        <Press onPress={() => router.push(`/recipe/${r.id}`)}>
          <Row style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <T v="heading">{r.name}</T>
              <Spacer h={4} />
              <Row style={{ gap: 10, flexWrap: 'wrap' }}>
                <CookTime minutes={r.minutes} />
                <EffortMeter effort={r.effort} size={6} />
                <T v="caption" style={{ fontSize: 11 }}>
                  {n ? `${n} ${n === 1 ? 'ingredient' : 'ingredients'}` : 'No ingredients yet'}
                  {pantry.length && n ? (m.missing.length ? ` · ${m.missing.length} to buy` : ' · all here') : ''}
                </T>
              </Row>
            </View>
            <Press
              hitSlop={10}
              onPress={() => {
                tap();
                toggleWanted(r.id);
              }}
            >
              <Ionicons
                name={r.wanted ? 'star' : 'star-outline'}
                size={19}
                color={r.wanted ? colors.gold : colors.inkMuted}
              />
            </Press>
          </Row>

          {n ? (
            <>
              <Spacer h={6} />
              <T v="caption" numberOfLines={2}>
                {r.ingredients.join(' · ')}
              </T>
            </>
          ) : null}
          <Spacer h={8} />
          <Row style={{ gap: 6, flexWrap: 'wrap' }}>
            {hasSteps ? <Tag icon="list-outline" text="Steps" /> : null}
            {r.link ? <Tag icon="link-outline" text="Link" /> : null}
            {r.lastCooked ? (
              <T v="caption" style={{ fontSize: 11 }}>
                Cooked {lastDoneLabel(r.lastCooked).toLowerCase()}
              </T>
            ) : null}
          </Row>
        </Press>

        <Spacer h={11} />
        <Row style={{ gap: 8 }}>
          <Btn
            small
            style={{ flex: 1 }}
            tone="quiet"
            icon="cart-outline"
            label="To the list"
            onPress={() => {
              const k = recipeToList(r.id);
              say(k ? `${k} on the shopping list, starred for the planner` : 'Nothing missing, starred for the planner');
            }}
          />
          <Btn
            small
            style={{ flex: 1 }}
            tone="primary"
            icon="restaurant-outline"
            label={planned ? 'Picked' : 'Pick it'}
            disabled={!!planned && !byDay}
            onPress={() => {
              if (byDay) return setPlanning(r);
              planMeal(r.id);
              say(`${r.name} is in Let's cook it`);
            }}
          />
        </Row>
      </Card>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Screen keyboardShouldPersistTaps="handled">
          <Row style={{ justifyContent: 'space-between' }}>
            <IconBtn
              name="chevron-back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            />
            <T v="heading">Kitchen</T>
            <View style={{ width: 38 }} />
          </Row>

          <Spacer h={12} />
          <KitchenTabs active="recipes" />

          <Spacer h={16} />
          <T v="display" style={{ fontSize: 30 }}>
            My recipe book
          </T>
          <Spacer h={10} />
          <Row style={{ gap: 14, alignItems: 'center' }}>
            <RecipeBookArt size={120} />
            <Press
              onPress={() => router.push('/recipe/new')}
              style={{
                width: 76,
                height: 76,
                borderRadius: radius.lg,
                borderWidth: 2,
                borderColor: colors.coral,
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.card,
              }}
            >
              <Ionicons name="add" size={30} color={colors.coral} />
              <T v="caption" color={colors.coralDeep}>
                Add
              </T>
            </Press>
            <T v="label" style={{ flex: 1 }}>
              {recipes.length
                ? `${recipes.length} written down, ready to cook again.`
                : 'Write a dish down once, cook it forever.'}
            </T>
          </Row>

          <Spacer h={14} />
          <Row
            style={{
              backgroundColor: colors.cardAlt,
              borderRadius: radius.md,
              paddingHorizontal: 12,
              gap: 8,
            }}
          >
            <Ionicons name="search" size={14} color={colors.inkMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search a dish or an ingredient"
              placeholderTextColor={colors.inkMuted}
              style={{
                flex: 1,
                paddingVertical: 11,
                fontFamily: font.medium,
                fontSize: 14.5,
                color: colors.ink,
              }}
            />
            {query ? (
              <Press onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={15} color={colors.inkMuted} />
              </Press>
            ) : null}
          </Row>

          <Spacer h={10} />
          <Row style={{ gap: 6 }}>
            <Chip small label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
            <Chip
              small
              icon="star"
              label="Starred"
              active={filter === 'starred'}
              onPress={() => setFilter('starred')}
            />
            <Chip
              small
              icon="flash"
              label="Quick"
              active={filter === 'quick'}
              onPress={() => setFilter('quick')}
            />
          </Row>

          <Spacer h={14} />
          {!recipes.length ? (
            <Card soft style={{ padding: 20, alignItems: 'center' }}>
              <T style={{ fontSize: 30 }}>{'\u{1F4D6}'}</T>
              <Spacer h={8} />
              <T v="heading" center>
                The book is empty
              </T>
              <Spacer h={6} />
              <T v="body" center style={{ maxWidth: 280 }}>
                Add a dish with its ingredients, and the steps or a link to them. Then plan it for
                the next days or put what is missing on the shopping list.
              </T>
              <Spacer h={14} />
              <Btn icon="add" label="Add a recipe" onPress={() => router.push('/recipe/new')} />
            </Card>
          ) : !shown.length ? (
            <T v="body" center color={colors.inkMuted}>
              {query.trim() ? `Nothing matches “${query.trim()}”.` : 'Nothing in here yet.'}
            </T>
          ) : (
            shown.map(renderCard)
          )}
        </Screen>
      </KeyboardAvoidingView>

      {planning ? (
        <DaySheet
          title={planning.name}
          taken={mealPlan.filter((p) => p.recipeId === planning.id).map((p) => p.day)}
          onClose={() => setPlanning(null)}
          onPick={(d) => {
            planMeal(planning.id, d);
            setPlanning(null);
            say(d ? `${planning.name} is on the plan` : `${planning.name} is in your picks`);
          }}
        />
      ) : null}
      {toast ? <Toast text={toast} bottom={30} /> : null}
    </View>
  );
}

function Tag({
  icon,
  text,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  tint?: boolean;
}) {
  return (
    <Row
      style={{
        gap: 4,
        backgroundColor: tint ? colors.sageSoft : colors.cardAlt,
        borderRadius: radius.pill,
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}
    >
      <Ionicons name={icon} size={10} color={tint ? colors.sageDeep : colors.inkSoft} />
      <T v="caption" style={{ fontSize: 10.5 }} color={tint ? colors.sageDeep : colors.inkSoft}>
        {text}
      </T>
    </Row>
  );
}
