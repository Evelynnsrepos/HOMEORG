import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { View } from 'react-native';

import { places, qtyLabel } from '../src/data/units';
import { expiringSoon, nextDays, shelfLifeLabel } from '../src/lib/kitchen';
import { useStore } from '../src/state/store';
import { colors, radius } from '../src/theme';
import { Btn, Card, IconBtn, Press, Row, Screen, Spacer, T } from '../src/ui/base';
import { CookTime, EffortMeter, dayLabel } from '../src/ui/Kitchen';
import { KitchenTabs } from '../src/ui/KitchenTabs';

/**
 * The kitchen at a glance: what is on the shelves, what is planned for the
 * next days, and the recipe book. Each card opens the screen that does the work.
 */
export default function Kitchen() {
  const router = useRouter();
  const pantry = useStore((s) => s.pantry);
  const recipes = useStore((s) => s.recipes);
  const mealPlan = useStore((s) => s.mealPlan);
  const shopping = useStore((s) => s.shopping);

  const soon = useMemo(() => expiringSoon(pantry), [pantry]);
  const days = nextDays(3);
  const byId = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);
  const toBuy = shopping.filter((s) => !s.done).length;

  // freshest additions first: that is what you are most likely looking for
  const recent = useMemo(
    () => [...pantry].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 5),
    [pantry],
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

      <Spacer h={16} />
      <T v="display" style={{ fontSize: 28 }}>
        Pantry
      </T>
      <Spacer h={6} />
      <T v="label">
        {pantry.length
          ? `${pantry.length} ${pantry.length === 1 ? 'thing' : 'things'} on the shelves${soon.length ? `, ${soon.length} to use up soon` : ''}.`
          : 'Nothing on the shelves yet.'}
      </T>

      {/* What's there --------------------------------------------- */}
      <Spacer h={16} />
      <Press onPress={() => router.push('/pantry')}>
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="over">What's there</T>
            <Row style={{ gap: 3 }}>
              <T v="caption" color={colors.coralDeep}>
                Open the shelves
              </T>
              <Ionicons name="chevron-forward" size={12} color={colors.coralDeep} />
            </Row>
          </Row>
          <Spacer h={10} />
          <Row style={{ gap: 8 }}>
            {places.map((p) => {
              const n = pantry.filter((i) => i.place === p.id).length;
              return (
                <View
                  key={p.id}
                  style={{
                    flex: 1,
                    backgroundColor: colors.cardAlt,
                    borderRadius: radius.md,
                    paddingVertical: 10,
                    alignItems: 'center',
                  }}
                >
                  <T style={{ fontSize: 18 }}>{p.emoji}</T>
                  <T v="title" style={{ fontSize: 18 }}>
                    {n}
                  </T>
                  <T v="caption">{p.name}</T>
                </View>
              );
            })}
          </Row>
          {recent.length ? (
            <>
              <Spacer h={10} />
              {recent.map((p) => (
                <Row key={p.id} style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
                  <T v="body" color={colors.ink} numberOfLines={1} style={{ flex: 1 }}>
                    {p.name}
                  </T>
                  <T v="caption">{qtyLabel(p.qty, p.unit)}</T>
                </Row>
              ))}
            </>
          ) : null}
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
          <Btn
            small
            tone="sage"
            icon="barcode-outline"
            label="Scan"
            onPress={() => router.push('/scan')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Btn
            small
            tone="quiet"
            icon="document-text-outline"
            label="REWE PDF"
            onPress={() => router.push('/import')}
          />
        </View>
      </Row>

      {/* Plan what to cook ---------------------------------------- */}
      <Spacer h={16} />
      <Press onPress={() => router.push('/cook')}>
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="over">Plan what to cook?</T>
            <Row style={{ gap: 3 }}>
              <T v="caption" color={colors.coralDeep}>
                Let's cook it
              </T>
              <Ionicons name="chevron-forward" size={12} color={colors.coralDeep} />
            </Row>
          </Row>
          <Spacer h={8} />
          {days.map((d, i) => {
            const meals = mealPlan.filter((m) => m.day === d && byId.has(m.recipeId));
            return (
              <Row
                key={d}
                style={{
                  paddingVertical: 8,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: colors.lineSoft,
                  gap: 10,
                }}
              >
                <T v="label" style={{ width: 72 }}>
                  {dayLabel(d)}
                </T>
                <T
                  v="body"
                  color={meals.length ? colors.ink : colors.inkMuted}
                  numberOfLines={1}
                  style={{ flex: 1 }}
                >
                  {meals.length
                    ? meals.map((m) => byId.get(m.recipeId)!.name).join(', ')
                    : 'Nothing planned'}
                </T>
              </Row>
            );
          })}
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

      {/* My recipes ----------------------------------------------- */}
      <Spacer h={16} />
      <Card>
        <Press onPress={() => router.push('/recipes')}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row style={{ gap: 7 }}>
              <Ionicons name="book-outline" size={15} color={colors.inkSoft} />
              <T v="over">My recipes</T>
            </Row>
            <Row style={{ gap: 3 }}>
              <T v="caption" color={colors.coralDeep}>
                {recipes.length ? `All ${recipes.length}` : 'Open the book'}
              </T>
              <Ionicons name="chevron-forward" size={12} color={colors.coralDeep} />
            </Row>
          </Row>
        </Press>
        <Spacer h={8} />
        {book.length ? (
          book.map((r, i) => (
            <Press
              key={r.id}
              onPress={() => router.push(`/recipe/${r.id}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 9,
                borderTopWidth: i ? 1 : 0,
                borderTopColor: colors.lineSoft,
              }}
            >
              {r.wanted ? <Ionicons name="star" size={12} color={colors.gold} /> : null}
              <T v="body" color={colors.ink} style={{ flex: 1 }} numberOfLines={1}>
                {r.name}
              </T>
              <EffortMeter effort={r.effort} size={6} />
              <CookTime minutes={r.minutes} />
            </Press>
          ))
        ) : (
          <Btn small tone="quiet" icon="add" label="Add your first recipe" onPress={() => router.push('/recipe/new')} />
        )}
      </Card>
    </Screen>
  );
}
