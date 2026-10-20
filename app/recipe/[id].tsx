import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { qtyLabel } from '../../src/data/units';
import { lastDoneLabel } from '../../src/lib/date';
import { cookTimeLabel, effortLabel, matchRecipe } from '../../src/lib/kitchen';
import { useStore } from '../../src/state/store';
import { colors, radius } from '../../src/theme';
import { Btn, Card, IconBtn, Press, Row, Screen, Spacer, T, tap } from '../../src/ui/base';
import { DaySheet, EffortMeter, dayLabel } from '../../src/ui/Kitchen';
import { Toast } from '../../src/ui/TaskRow';

/** One dish to cook from: what goes in, how it goes, and when it is planned. */
export default function RecipeView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const recipe = useStore((s) => s.recipes.find((r) => r.id === id));
  const pantry = useStore((s) => s.pantry);
  const allPlans = useStore((s) => s.mealPlan);
  const toggleWanted = useStore((s) => s.toggleWanted);
  const cookRecipe = useStore((s) => s.cookRecipe);
  const recipeToList = useStore((s) => s.recipeToList);
  const planMeal = useStore((s) => s.planMeal);
  const unplanMeal = useStore((s) => s.unplanMeal);

  const [picking, setPicking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const plans = useMemo(
    () => allPlans.filter((m) => m.recipeId === id).sort((a, b) => a.day.localeCompare(b.day)),
    [allPlans, id],
  );

  function say(text: string) {
    setToast(text);
    setTimeout(() => setToast(null), 2600);
  }

  function leave() {
    if (router.canGoBack()) router.back();
    else router.replace('/recipes');
  }

  if (!recipe) {
    return (
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={leave} />
          <T v="heading">Recipe</T>
          <View style={{ width: 38 }} />
        </Row>
        <Spacer h={40} />
        <T v="body" center>
          This one is not in the book any more.
        </T>
      </Screen>
    );
  }

  const m = matchRecipe(recipe, pantry);
  const steps = (recipe.steps ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const time = cookTimeLabel(recipe.minutes);

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={leave} />
          <T v="heading">Recipe</T>
          <IconBtn name="create-outline" onPress={() => router.push(`/recipe/edit/${recipe.id}`)} />
        </Row>

        <Spacer h={16} />
        <Row style={{ alignItems: 'flex-start' }}>
          <T v="display" style={{ fontSize: 28, lineHeight: 32, flex: 1 }}>
            {recipe.name}
          </T>
          <Press
            hitSlop={10}
            onPress={() => {
              tap();
              toggleWanted(recipe.id);
            }}
          >
            <Ionicons
              name={recipe.wanted ? 'star' : 'star-outline'}
              size={22}
              color={recipe.wanted ? colors.gold : colors.inkMuted}
            />
          </Press>
        </Row>
        <Spacer h={8} />
        <Row style={{ gap: 12, flexWrap: 'wrap' }}>
          {time ? (
            <Row style={{ gap: 4 }}>
              <Ionicons name="time-outline" size={14} color={colors.inkSoft} />
              <T v="label">{time}</T>
            </Row>
          ) : null}
          {recipe.effort ? (
            <Row style={{ gap: 6 }}>
              <EffortMeter effort={recipe.effort} />
              <T v="label">{effortLabel[recipe.effort]}</T>
            </Row>
          ) : null}
          <T v="label" color={colors.inkMuted}>
            {recipe.lastCooked ? `Cooked ${lastDoneLabel(recipe.lastCooked).toLowerCase()}` : 'Not cooked yet'}
          </T>
        </Row>

        {/* Ingredients ----------------------------------------------- */}
        <Spacer h={20} />
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="over">Ingredients</T>
          {pantry.length && recipe.ingredients.length ? (
            <T v="caption" color={m.missing.length ? colors.inkMuted : colors.sageDeep}>
              {m.missing.length ? `${m.missing.length} still to buy` : 'All in the kitchen'}
            </T>
          ) : null}
        </Row>
        <Spacer h={8} />
        {recipe.ingredients.length ? (
          <Card style={{ padding: 4 }}>
            {m.parts.map(({ name, have }, i) => (
              <Row
                key={`${name}-${i}`}
                style={{
                  gap: 10,
                  paddingVertical: 9,
                  paddingHorizontal: 10,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: colors.lineSoft,
                }}
              >
                <Ionicons
                  name={have ? 'checkmark-circle' : 'ellipse-outline'}
                  size={17}
                  color={have ? colors.sageDeep : colors.line}
                />
                <T v="body" color={colors.ink} style={{ flex: 1 }}>
                  {name}
                </T>
                {have ? (
                  <T v="caption" color={colors.sageDeep}>
                    {qtyLabel(have.qty, have.unit)}
                  </T>
                ) : null}
              </Row>
            ))}
          </Card>
        ) : (
          <T v="caption">No ingredients written down.</T>
        )}

        {/* Steps ---------------------------------------------------- */}
        {steps.length || recipe.link ? (
          <>
            <Spacer h={20} />
            <T v="over">How it goes</T>
            <Spacer h={8} />
            {steps.map((s, i) => (
              <Row key={i} style={{ alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.coralSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <T v="caption" color={colors.coralDeep} style={{ fontSize: 11 }}>
                    {i + 1}
                  </T>
                </View>
                <T v="body" color={colors.ink} style={{ flex: 1 }}>
                  {s}
                </T>
              </Row>
            ))}
            {recipe.link ? (
              <Btn
                tone="quiet"
                icon="open-outline"
                label="Open the recipe online"
                onPress={() => {
                  const url = /^https?:\/\//i.test(recipe.link!) ? recipe.link! : `https://${recipe.link}`;
                  Linking.openURL(url).catch(() => say('That link would not open'));
                }}
              />
            ) : null}
          </>
        ) : null}

        {/* Planned -------------------------------------------------- */}
        <Spacer h={20} />
        <T v="over">On the plan</T>
        <Spacer h={8} />
        <Row style={{ flexWrap: 'wrap', gap: 6 }}>
          {plans.map((p) => (
            <Press
              key={p.id}
              onPress={() => unplanMeal(p.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingVertical: 7,
                paddingHorizontal: 11,
                borderRadius: radius.pill,
                backgroundColor: colors.sageSoft,
              }}
            >
              <T v="caption" color={colors.sageDeep}>
                {dayLabel(p.day)}
              </T>
              <Ionicons name="close" size={12} color={colors.sageDeep} />
            </Press>
          ))}
          <Press
            onPress={() => setPicking(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingVertical: 7,
              paddingHorizontal: 11,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.card,
            }}
          >
            <Ionicons name="add" size={12} color={colors.inkSoft} />
            <T v="caption" color={colors.inkSoft}>
              Plan a day
            </T>
          </Press>
        </Row>

        <Spacer h={24} />
        <Row style={{ gap: 8 }}>
          <Btn
            style={{ flex: 1 }}
            tone="quiet"
            icon="cart-outline"
            label="To the list"
            onPress={() => {
              const n = recipeToList(recipe.id);
              say(n ? `${n} on the shopping list` : 'You have it all, starred for the planner');
            }}
          />
          <Btn
            style={{ flex: 1 }}
            tone="sage"
            icon="restaurant-outline"
            label="Cooked it"
            onPress={() => {
              cookRecipe(recipe.id);
              say(pantry.length ? `${recipe.name} came off the shelves` : `${recipe.name} it is`);
            }}
          />
        </Row>
      </Screen>

      {picking ? (
        <DaySheet
          title={recipe.name}
          taken={plans.map((p) => p.day)}
          onClose={() => setPicking(false)}
          onPick={(d) => {
            planMeal(recipe.id, d);
            setPicking(false);
          }}
        />
      ) : null}
      {toast ? <Toast text={toast} bottom={30} /> : null}
    </View>
  );
}
