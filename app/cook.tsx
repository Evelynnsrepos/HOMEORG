import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { matchRecipes, nextDays } from '../src/lib/kitchen';
import type { Recipe } from '../src/lib/types';
import { useStore } from '../src/state/store';
import { colors, font, radius } from '../src/theme';
import { Btn, Card, IconBtn, Press, Row, Screen, Spacer, T, tap } from '../src/ui/base';
import { CookTime, DaySheet, EffortMeter, RecipeTile, dayLabel } from '../src/ui/Kitchen';
import { KitchenTabs } from '../src/ui/KitchenTabs';
import { Toast } from '../src/ui/TaskRow';

/**
 * "Let's cook it": the next seven days with a dish or two on each, and the
 * book underneath to pick from. Starred recipes and the ones the shelves can
 * already supply float to the top.
 */
export default function Cook() {
  const router = useRouter();
  const { width: W } = useWindowDimensions();

  const recipes = useStore((s) => s.recipes);
  const pantry = useStore((s) => s.pantry);
  const mealPlan = useStore((s) => s.mealPlan);
  const planMeal = useStore((s) => s.planMeal);
  const unplanMeal = useStore((s) => s.unplanMeal);
  const recipeToList = useStore((s) => s.recipeToList);

  const [query, setQuery] = useState('');
  const [view, setView] = useState<'tiles' | 'list'>('tiles');
  const [forRecipe, setForRecipe] = useState<Recipe | null>(null);
  const [forDay, setForDay] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function say(text: string) {
    setToast(text);
    setTimeout(() => setToast(null), 2600);
  }

  const days = nextDays(7);
  const byId = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);
  const upcoming = mealPlan.filter((m) => m.day >= days[0] && m.day <= days[6] && byId.has(m.recipeId));

  const picks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return matchRecipes(recipes, pantry).filter(
      (m) =>
        !q ||
        m.recipe.name.toLowerCase().includes(q) ||
        m.recipe.ingredients.some((i) => i.toLowerCase().includes(q)),
    );
  }, [recipes, pantry, query]);

  const tileW = Math.floor((W - 32 - 8) / 2);

  function noteFor(missing: string[], n: number) {
    if (!n || !pantry.length) return undefined;
    return missing.length ? `${missing.length} to buy` : 'All in the kitchen';
  }

  function shopForPlan() {
    const ids = [...new Set(upcoming.map((m) => m.recipeId))];
    const n = ids.reduce((sum, id) => sum + recipeToList(id), 0);
    say(n ? `${n} on the shopping list` : 'You have everything for the plan');
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
          <KitchenTabs active="cook" />

          <Spacer h={16} />
          <T v="display" style={{ fontSize: 28 }}>
            Let's cook it
          </T>
          <Spacer h={6} />
          <T v="label">
            {upcoming.length
              ? `${upcoming.length} ${upcoming.length === 1 ? 'dish' : 'dishes'} planned for the next days.`
              : 'Put a dish on one of the next days.'}
          </T>

          {/* Add from the book or to the book --------------------------- */}
          <Spacer h={14} />
          <Row style={{ gap: 8 }}>
            <Btn
              style={{ flex: 1 }}
              small
              icon="book-outline"
              label="From the book"
              onPress={() => setForDay(days[0])}
            />
            <Btn
              style={{ flex: 1 }}
              small
              tone="quiet"
              icon="add"
              label="New to the book"
              onPress={() => router.push('/recipe/new')}
            />
          </Row>

          {/* The next seven days ---------------------------------------- */}
          <Spacer h={16} />
          <Card style={{ padding: 4 }}>
            {days.map((d, i) => {
              const meals = upcoming.filter((m) => m.day === d);
              return (
                <Row
                  key={d}
                  style={{
                    paddingVertical: 9,
                    paddingHorizontal: 10,
                    borderTopWidth: i ? 1 : 0,
                    borderTopColor: colors.lineSoft,
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <T
                    v="label"
                    style={{ width: 72, paddingTop: 5 }}
                    color={i === 0 ? colors.coralDeep : colors.inkSoft}
                  >
                    {dayLabel(d)}
                  </T>
                  <Row style={{ flex: 1, flexWrap: 'wrap', gap: 6 }}>
                    {meals.map((m) => {
                      const r = byId.get(m.recipeId)!;
                      return (
                        <Press
                          key={m.id}
                          onPress={() => router.push(`/recipe/${r.id}`)}
                          onLongPress={() => unplanMeal(m.id)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            backgroundColor: colors.sageSoft,
                            borderRadius: radius.pill,
                            paddingLeft: 11,
                            paddingRight: 7,
                            paddingVertical: 6,
                          }}
                        >
                          <T v="caption" color={colors.sageDeep} style={{ fontSize: 12 }}>
                            {r.name}
                          </T>
                          <Press hitSlop={8} onPress={() => unplanMeal(m.id)}>
                            <Ionicons name="close" size={12} color={colors.sageDeep} />
                          </Press>
                        </Press>
                      );
                    })}
                    <Press
                      onPress={() => setForDay(d)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: colors.line,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="add" size={14} color={colors.inkMuted} />
                    </Press>
                  </Row>
                </Row>
              );
            })}
          </Card>
          {upcoming.length ? (
            <>
              <Spacer h={10} />
              <Btn
                small
                tone="ghost"
                icon="cart-outline"
                label="Put what the plan needs on the list"
                onPress={shopForPlan}
              />
            </>
          ) : null}

          {/* Picks ------------------------------------------------------ */}
          <Spacer h={20} />
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="over">Pick for the next days</T>
            <Row style={{ gap: 2 }}>
              <ViewToggle icon="grid-outline" on={view === 'tiles'} onPress={() => setView('tiles')} />
              <ViewToggle icon="list-outline" on={view === 'list'} onPress={() => setView('list')} />
            </Row>
          </Row>
          <Spacer h={8} />
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
              placeholder="Search your picks for the next days"
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

          {!recipes.length ? (
            <Card soft style={{ padding: 20, alignItems: 'center' }}>
              <T v="heading" center>
                No recipes to pick from yet
              </T>
              <Spacer h={6} />
              <T v="body" center>
                Add some to your recipe book and they show up here.
              </T>
            </Card>
          ) : !picks.length ? (
            <T v="body" center color={colors.inkMuted}>
              Nothing matches {'“' + query.trim() + '”'}.
            </T>
          ) : view === 'tiles' ? (
            <Row style={{ flexWrap: 'wrap', gap: 8, alignItems: 'stretch' }}>
              {picks.map(({ recipe, missing }) => (
                <RecipeTile
                  key={recipe.id}
                  recipe={recipe}
                  width={tileW}
                  note={noteFor(missing, recipe.ingredients.length)}
                  noteColor={missing.length ? colors.inkMuted : colors.sageDeep}
                  onPress={() => setForRecipe(recipe)}
                />
              ))}
            </Row>
          ) : (
            <Card style={{ padding: 4 }}>
              {picks.map(({ recipe, missing }, i) => {
                const note = noteFor(missing, recipe.ingredients.length);
                return (
                  <Press
                    key={recipe.id}
                    onPress={() => setForRecipe(recipe)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingVertical: 11,
                      paddingHorizontal: 10,
                      borderTopWidth: i ? 1 : 0,
                      borderTopColor: colors.lineSoft,
                    }}
                  >
                    {recipe.wanted ? <Ionicons name="star" size={12} color={colors.gold} /> : null}
                    <View style={{ flex: 1 }}>
                      <T v="heading" style={{ fontSize: 14 }} numberOfLines={1}>
                        {recipe.name}
                      </T>
                      {note ? (
                        <T v="caption" color={missing.length ? colors.inkMuted : colors.sageDeep}>
                          {note}
                        </T>
                      ) : null}
                    </View>
                    <EffortMeter effort={recipe.effort} size={6} />
                    <CookTime minutes={recipe.minutes} />
                  </Press>
                );
              })}
            </Card>
          )}
          <Spacer h={10} />
          <T v="caption" center>
            Tap a dish to give it a day. Hold a planned one to take it off.
          </T>
        </Screen>
      </KeyboardAvoidingView>

      {forRecipe ? (
        <DaySheet
          title={forRecipe.name}
          taken={mealPlan.filter((p) => p.recipeId === forRecipe.id).map((p) => p.day)}
          onClose={() => setForRecipe(null)}
          onPick={(d) => {
            planMeal(forRecipe.id, d);
            setForRecipe(null);
            say(`${forRecipe.name} on ${dayLabel(d).toLowerCase()}`);
          }}
        />
      ) : null}

      {forDay ? (
        <BookSheet
          day={forDay}
          days={days}
          recipes={recipes}
          onDay={setForDay}
          onClose={() => setForDay(null)}
          onPick={(r) => {
            planMeal(r.id, forDay);
            setForDay(null);
            say(`${r.name} on ${dayLabel(forDay).toLowerCase()}`);
          }}
          onNew={() => {
            setForDay(null);
            router.push('/recipe/new');
          }}
        />
      ) : null}

      {toast ? <Toast text={toast} bottom={30} /> : null}
    </View>
  );
}

function ViewToggle({
  icon,
  on,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Press
      hitSlop={6}
      onPress={() => {
        tap();
        onPress();
      }}
      style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: on ? colors.card : 'transparent',
        borderWidth: on ? 1 : 0,
        borderColor: colors.line,
      }}
    >
      <Ionicons name={icon} size={15} color={on ? colors.ink : colors.inkMuted} />
    </Press>
  );
}

/** The whole book in a sheet, to drop a dish onto one day. */
function BookSheet({
  day,
  days,
  recipes,
  onDay,
  onPick,
  onNew,
  onClose,
}: {
  day: string;
  days: string[];
  recipes: Recipe[];
  onDay: (d: string) => void;
  onPick: (r: Recipe) => void;
  onNew: () => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const list = [...recipes]
    .filter((r) => !q.trim() || r.name.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (!!a.wanted !== !!b.wanted ? (a.wanted ? -1 : 1) : a.name.localeCompare(b.name)));

  return (
    <Pressable
      onPress={onClose}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#2E2A25CC',
        justifyContent: 'flex-end',
      }}
    >
      <Pressable onPress={() => {}}>
        <Card style={{ margin: 12, padding: 18 }}>
          <T v="over">From the book, for</T>
          <Spacer h={8} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Row style={{ gap: 6 }}>
              {days.map((d) => (
                <Press
                  key={d}
                  onPress={() => onDay(d)}
                  style={{
                    paddingVertical: 7,
                    paddingHorizontal: 12,
                    borderRadius: radius.pill,
                    backgroundColor: d === day ? colors.ink : colors.cardAlt,
                  }}
                >
                  <T v="caption" color={d === day ? colors.onDark : colors.inkSoft}>
                    {dayLabel(d)}
                  </T>
                </Press>
              ))}
            </Row>
          </ScrollView>
          <Spacer h={12} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search the book"
            placeholderTextColor={colors.inkMuted}
            style={{
              backgroundColor: colors.cardAlt,
              borderRadius: radius.md,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontFamily: font.medium,
              fontSize: 14.5,
              color: colors.ink,
            }}
          />
          <Spacer h={8} />
          <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
            {list.map((r) => (
              <Press
                key={r.id}
                onPress={() => onPick(r)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 11,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.lineSoft,
                }}
              >
                {r.wanted ? <Ionicons name="star" size={12} color={colors.gold} /> : null}
                <T v="body" color={colors.ink} style={{ flex: 1 }} numberOfLines={1}>
                  {r.name}
                </T>
                <EffortMeter effort={r.effort} size={6} />
                <CookTime minutes={r.minutes} />
              </Press>
            ))}
            {!list.length ? (
              <T v="caption" center style={{ paddingVertical: 14 }}>
                {recipes.length ? 'Nothing matches.' : 'The book is empty.'}
              </T>
            ) : null}
          </ScrollView>
          <Spacer h={12} />
          <Row style={{ gap: 8 }}>
            <Btn style={{ flex: 1 }} small tone="quiet" icon="add" label="New recipe" onPress={onNew} />
            <Btn style={{ flex: 1 }} small tone="ghost" label="Close" onPress={onClose} />
          </Row>
        </Card>
      </Pressable>
    </Pressable>
  );
}
