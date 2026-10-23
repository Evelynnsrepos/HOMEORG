import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { View } from 'react-native';

import { qtyLabel } from '../src/data/units';
import { expiringSoon, shelfLifeLabel } from '../src/lib/kitchen';
import { useStore } from '../src/state/store';
import { colors, font, radius } from '../src/theme';
import { RecipeBookArt } from '../src/ui/Art';
import { Btn, Card, IconBtn, Press, Row, Screen, Spacer, T } from '../src/ui/base';
import { Sticker } from '../src/ui/Decor';
import { EffortMeter, dayLabel } from '../src/ui/Kitchen';
import { KitchenTabs } from '../src/ui/KitchenTabs';

/**
 * The kitchen at a glance, as sketched: what's there (opens the pantry), a
 * few plan entries (opens "Let's cook it") and the recipe book. Each card is
 * a doorway to the screen that does the work.
 */
export default function Kitchen() {
  const router = useRouter();
  const pantry = useStore((s) => s.pantry);
  const recipes = useStore((s) => s.recipes);
  const mealPlan = useStore((s) => s.mealPlan);
  const shopping = useStore((s) => s.shopping);

  const soon = useMemo(() => expiringSoon(pantry), [pantry]);
  const byId = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);
  const toBuy = shopping.filter((s) => !s.done).length;

  // freshest additions first: that is what you are most likely looking for
  const recent = useMemo(
    () => [...pantry].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 5),
    [pantry],
  );

  const picks = useMemo(
    () =>
      mealPlan
        .filter((m) => byId.has(m.recipeId))
        .sort((a, b) => (!!a.day !== !!b.day ? (a.day ? -1 : 1) : (a.day ?? '').localeCompare(b.day ?? '')))
        .slice(0, 6),
    [mealPlan, byId],
  );

  const book = useMemo(
    () =>
      [...recipes]
        .sort((a, b) => {
          if (!!a.wanted !== !!b.wanted) return a.wanted ? -1 : 1;
          return (b.lastCooked ?? b.createdAt).localeCompare(a.lastCooked ?? a.createdAt);
        })
        .slice(0, 3),
    [recipes],
  );

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconBtn
          name="chevron-back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
        <T v="heading">Kitchen</T>
        <View style={{ width: 38 }} />
      </Row>

      <Spacer h={12} />
      <KitchenTabs active="kitchen" />

      {/* What's there --------------------------------------------- */}
      <Spacer h={16} />
      <Press onPress={() => router.push('/pantry')}>
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="title" style={{ fontSize: 21 }}>
              What's there
            </T>
            <Row style={{ gap: 3 }}>
              <T v="caption" color={colors.coralDeep}>
                {pantry.length ? `All ${pantry.length}` : 'Open the shelves'}
              </T>
              <Ionicons name="chevron-forward" size={12} color={colors.coralDeep} />
            </Row>
          </Row>
          <Spacer h={8} />
          {recent.length ? (
            recent.map((p) => (
              <Row key={p.id} style={{ paddingVertical: 5, gap: 6 }}>
                <View
                  style={{
                    backgroundColor: colors.cardAlt,
                    borderRadius: radius.sm,
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    maxWidth: '62%',
                  }}
                >
                  <T v="label" color={colors.ink} numberOfLines={1}>
                    {p.name}
                  </T>
                </View>
                {/* the dotted line from the sketch, name to amount */}
                <View style={{ flex: 1, borderBottomWidth: 1.5, borderStyle: 'dotted', borderColor: colors.line, marginTop: 8 }} />
                <T v="label" style={{ fontFamily: font.semi }}>
                  {qtyLabel(p.qty, p.unit)}
                </T>
              </Row>
            ))
          ) : (
            <T v="caption">Nothing on the shelves yet. Scan something or import a REWE PDF.</T>
          )}
          {soon.length ? (
            <>
              <Spacer h={8} />
              <Row style={{ gap: 6 }}>
                <Ionicons name="time-outline" size={13} color={colors.needsLove} />
                <T v="caption" color={colors.needsLove} numberOfLines={1} style={{ flex: 1 }}>
                  Use up: {soon.slice(0, 3).map((p) => `${p.name} (${shelfLifeLabel(p.bestBefore!)})`).join(', ')}
                  {soon.length > 3 ? ` and ${soon.length - 3} more` : ''}
                </T>
              </Row>
            </>
          ) : null}
        </Card>
      </Press>

      <Spacer h={10} />
      <Row style={{ gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Btn small tone="sage" icon="barcode-outline" label="Scan" onPress={() => router.push('/scan')} />
        </View>
        <View style={{ flex: 1 }}>
          <Btn small tone="quiet" icon="document-text-outline" label="REWE PDF" onPress={() => router.push('/import')} />
        </View>
      </Row>

      {/* Plan what to cook? --------------------------------------- */}
      <Spacer h={16} />
      <Press onPress={() => router.push('/cook')}>
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="title" style={{ fontSize: 21 }}>
              Plan what to cook?
            </T>
            <Ionicons name="chevron-forward" size={14} color={colors.coralDeep} />
          </Row>
          <Spacer h={10} />
          {picks.length ? (
            <Row style={{ flexWrap: 'wrap', gap: 7 }}>
              {picks.map((m) => (
                <View
                  key={m.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: colors.coralSoft,
                    borderRadius: radius.md,
                    paddingHorizontal: 11,
                    paddingVertical: 7,
                  }}
                >
                  <T v="label" color={colors.ink}>
                    {byId.get(m.recipeId)!.name}
                  </T>
                  {m.day ? (
                    <T v="caption" color={colors.coralDeep}>
                      {dayLabel(m.day)}
                    </T>
                  ) : null}
                </View>
              ))}
            </Row>
          ) : (
            <T v="caption">Nothing picked yet. Tap to choose a few dishes for the next days.</T>
          )}
        </Card>
      </Press>

      {/* My recipes ----------------------------------------------- */}
      <Spacer h={16} />
      <Press onPress={() => router.push('/recipes')}>
        <Card>
          <T v="title" style={{ fontSize: 21 }}>
            My recipes
          </T>
          <Spacer h={10} />
          <Row style={{ gap: 12, alignItems: 'center' }}>
            <RecipeBookArt size={110} />
            <View style={{ flex: 1, gap: 7 }}>
              {book.length ? (
                book.map((r) => (
                  <Press
                    key={r.id}
                    onPress={() => router.push(`/recipe/${r.id}`)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      borderWidth: 1.5,
                      borderColor: colors.line,
                      borderRadius: radius.md,
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                    }}
                  >
                    {r.wanted ? <Ionicons name="star" size={11} color={colors.gold} /> : null}
                    <T v="label" color={colors.ink} style={{ flex: 1 }} numberOfLines={1}>
                      {r.name}
                    </T>
                    <EffortMeter effort={r.effort} size={6} />
                  </Press>
                ))
              ) : (
                <Btn small tone="quiet" icon="add" label="Your first recipe" onPress={() => router.push('/recipe/new')} />
              )}
            </View>
          </Row>
          <Sticker kind="cat" size={40} tilt={12} style={{ position: 'absolute', right: -6, top: -14 }} />
        </Card>
      </Press>

      <Spacer h={10} />
      <Press onPress={() => router.push('/shopping')}>
        <Card soft style={{ padding: 12 }}>
          <Row style={{ gap: 10 }}>
            <Ionicons name="cart-outline" size={18} color={colors.inkSoft} />
            <T v="heading" style={{ flex: 1, fontSize: 14 }}>
              Shopping list
            </T>
            <T v="caption">{toBuy ? `${toBuy} to buy` : 'Nothing to buy'}</T>
            <Ionicons name="chevron-forward" size={14} color={colors.inkMuted} />
          </Row>
        </Card>
      </Press>
    </Screen>
  );
}
