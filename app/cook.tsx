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
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { matchRecipe, nextDays } from '../src/lib/kitchen';
import type { PlannedMeal, Recipe } from '../src/lib/types';
import { useStore } from '../src/state/store';
import { colors, font, radius } from '../src/theme';
import { RecipeBookArt } from '../src/ui/Art';
import { Btn, Card, IconBtn, Press, Row, Screen, Spacer, T, tap } from '../src/ui/base';
import { Sticker } from '../src/ui/Decor';
import { CookTime, DaySheet, EffortMeter, PickTile, dayLabel, packRows, tileSpan } from '../src/ui/Kitchen';
import { KitchenTabs } from '../src/ui/KitchenTabs';
import { Toast } from '../src/ui/TaskRow';

type Pick = { meal: PlannedMeal; recipe: Recipe };

/**
 * "Let's cook it", after the sketch: a big banner, one button to add from the
 * recipe book (or write a new one into it), a search over your picks, and the
 * picks themselves as packed tiles or a list. It starts empty — only what you
 * put here shows up. Weekdays are optional: switch them on and the picks
 * group by day, leave them off and it's one shortlist of "soon".
 */
export default function Cook() {
  const router = useRouter();
  const { width: W } = useWindowDimensions();

  const recipes = useStore((s) => s.recipes);
  const pantry = useStore((s) => s.pantry);
  const mealPlan = useStore((s) => s.mealPlan);
  const byDay = useStore((s) => !!s.settings.cookByDay);
  const patchSettings = useStore((s) => s.patchSettings);
  const planMeal = useStore((s) => s.planMeal);
  const setMealDay = useStore((s) => s.setMealDay);
  const unplanMeal = useStore((s) => s.unplanMeal);
  const cookRecipe = useStore((s) => s.cookRecipe);
  const recipeToList = useStore((s) => s.recipeToList);

  const [query, setQuery] = useState('');
  const [view, setView] = useState<'tiles' | 'list'>('tiles');
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<Pick | null>(null);
  const [moving, setMoving] = useState<Pick | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function say(text: string) {
    setToast(text);
    setTimeout(() => setToast(null), 2600);
  }

  const byId = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);

  const picks: Pick[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mealPlan
      .filter((m) => byId.has(m.recipeId))
      .map((meal) => ({ meal, recipe: byId.get(meal.recipeId)! }))
      .filter(
        ({ recipe }) =>
          !q ||
          recipe.name.toLowerCase().includes(q) ||
          recipe.ingredients.some((i) => i.toLowerCase().includes(q)),
      )
      .sort((a, b) => {
        // dated picks in day order, then the undated ones in the order you picked them
        if (!!a.meal.day !== !!b.meal.day) return a.meal.day ? -1 : 1;
        return (a.meal.day ?? '').localeCompare(b.meal.day ?? '') || a.meal.createdAt.localeCompare(b.meal.createdAt);
      });
  }, [mealPlan, byId, query]);

  const total = mealPlan.filter((m) => byId.has(m.recipeId)).length;
  const picked = new Set(mealPlan.map((m) => m.recipeId));
  // starred dishes (that's what "to the list" does) come up here as a nudge
  const suggested = recipes.filter((r) => r.wanted && !picked.has(r.id)).slice(0, 6);

  const groups: { title?: string; items: Pick[] }[] = byDay
    ? [
        { title: 'Soon', items: picks.filter((p) => !p.meal.day) },
        ...[...new Set(picks.filter((p) => p.meal.day).map((p) => p.meal.day!))].map((d) => ({
          title: dayLabel(d),
          items: picks.filter((p) => p.meal.day === d),
        })),
      ].filter((g) => g.items.length)
    : [{ items: picks }];

  const inner = Math.min(W, 520) - 32;
  const GAP = 8;
  const colW = (inner - GAP * 5) / 6;

  function noteFor(r: Recipe) {
    if (!pantry.length || !r.ingredients.length) return undefined;
    const missing = matchRecipe(r, pantry).missing.length;
    return missing ? `${missing} to buy` : 'All here';
  }

  function shopForPicks() {
    const ids = [...new Set(mealPlan.map((m) => m.recipeId))].filter((id) => byId.has(id));
    const n = ids.reduce((sum, id) => sum + recipeToList(id), 0);
    say(n ? `${n} on the shopping list` : 'You have everything for your picks');
  }

  function renderTiles(items: Pick[]) {
    return packRows(items, (p) => tileSpan(p.recipe.minutes)).map((row, i) => (
      <Row key={i} style={{ gap: GAP, marginBottom: GAP }}>
        {row.map(({ item, span }) => (
          <PickTile
            key={item.meal.id}
            recipe={item.recipe}
            width={colW * span + GAP * (span - 1)}
            day={byDay ? undefined : item.meal.day}
            note={noteFor(item.recipe)}
            onPress={() => setOpen(item)}
            onLongPress={() => setMoving(item)}
          />
        ))}
      </Row>
    ));
  }

  function renderList(items: Pick[]) {
    return (
      <Card style={{ padding: 4, marginBottom: GAP }}>
        {items.map((p, i) => {
          const note = noteFor(p.recipe);
          return (
            <Press
              key={p.meal.id}
              onPress={() => setOpen(p)}
              onLongPress={() => setMoving(p)}
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
              <View style={{ flex: 1 }}>
                <T v="heading" style={{ fontSize: 14 }} numberOfLines={1}>
                  {p.recipe.name}
                </T>
                <T v="caption" numberOfLines={1}>
                  {[!byDay && p.meal.day ? dayLabel(p.meal.day) : null, note].filter(Boolean).join(' · ') || ' '}
                </T>
              </View>
              <EffortMeter effort={p.recipe.effort} size={7} />
              <CookTime minutes={p.recipe.minutes} />
            </Press>
          );
        })}
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
          <KitchenTabs active="cook" />

          {/* The banner ------------------------------------------------- */}
          <Spacer h={16} />
          <View style={{ borderRadius: radius.lg, overflow: 'hidden', minHeight: 116 }}>
            <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%">
              <Defs>
                <LinearGradient id="banner" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#FF9CC8" />
                  <Stop offset="0.6" stopColor="#FF79B0" />
                  <Stop offset="1" stopColor="#C58CF5" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#banner)" />
            </Svg>
            <View style={{ padding: 18, paddingRight: 110 }}>
              <T style={{ fontFamily: font.display, fontSize: 38, lineHeight: 40, color: '#FFFFFF' }}>
                Let's cook it
              </T>
              <Spacer h={6} />
              <T v="label" color="#FFF0F7">
                {total
                  ? `${total} ${total === 1 ? 'dish' : 'dishes'} picked for the next days`
                  : 'Pick a few dishes for the next days'}
              </T>
            </View>
            <Sticker kind="cake" size={62} tilt={10} style={{ position: 'absolute', right: 14, top: 10 }} />
            <Sticker kind="star" size={34} tilt={-14} style={{ position: 'absolute', right: 70, bottom: 6 }} />
          </View>

          {/* From the book or to the book ------------------------------- */}
          <Spacer h={12} />
          <Press
            onPress={() => setAdding(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: colors.card,
              borderRadius: radius.lg,
              borderWidth: 1.5,
              borderColor: colors.line,
              paddingVertical: 10,
              paddingHorizontal: 14,
            }}
          >
            <RecipeBookArt size={46} />
            <View style={{ flex: 1 }}>
              <T v="heading" style={{ fontSize: 15 }}>
                Add a recipe
              </T>
              <T v="caption">from your book, or write a new one into it</T>
            </View>
            <Ionicons name="add-circle" size={26} color={colors.coral} />
          </Press>

          {/* Search, view, weekdays ------------------------------------- */}
          <Spacer h={12} />
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
          <Spacer h={8} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Row style={{ gap: 2, backgroundColor: colors.cardAlt, borderRadius: 11, padding: 2 }}>
              <ViewToggle icon="grid-outline" on={view === 'tiles'} onPress={() => setView('tiles')} />
              <ViewToggle icon="list-outline" on={view === 'list'} onPress={() => setView('list')} />
            </Row>
            <Press
              onPress={() => {
                tap();
                patchSettings({ cookByDay: !byDay });
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 6,
                paddingHorizontal: 11,
                borderRadius: radius.pill,
                backgroundColor: byDay ? colors.coralSoft : 'transparent',
                borderWidth: 1,
                borderColor: byDay ? colors.coralSoft : colors.line,
              }}
            >
              <Ionicons name={byDay ? 'calendar' : 'calendar-outline'} size={13} color={byDay ? colors.coralDeep : colors.inkMuted} />
              <T v="caption" color={byDay ? colors.coralDeep : colors.inkSoft} style={{ fontFamily: font.semi }}>
                {byDay ? 'Planning by weekday' : 'Plan by weekday?'}
              </T>
            </Press>
          </Row>

          {/* Suggestions ----------------------------------------------- */}
          {suggested.length ? (
            <>
              <Spacer h={12} />
              <T v="over">Starred, maybe soon?</T>
              <Spacer h={6} />
              <Row style={{ flexWrap: 'wrap', gap: 6 }}>
                {suggested.map((r) => (
                  <Press
                    key={r.id}
                    onPress={() => {
                      planMeal(r.id);
                      say(`${r.name} picked`);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.line,
                      borderRadius: radius.pill,
                      paddingLeft: 11,
                      paddingRight: 8,
                      paddingVertical: 6,
                    }}
                  >
                    <T v="caption" color={colors.ink}>
                      {r.name}
                    </T>
                    <Ionicons name="add" size={13} color={colors.coralDeep} />
                  </Press>
                ))}
              </Row>
            </>
          ) : null}

          {/* The picks ------------------------------------------------- */}
          <Spacer h={14} />
          {!total ? (
            <Card soft style={{ padding: 22, alignItems: 'center' }}>
              <Sticker kind="icecream" size={56} tilt={-8} />
              <Spacer h={8} />
              <T v="heading" center>
                Nothing picked yet
              </T>
              <Spacer h={6} />
              <T v="body" center style={{ maxWidth: 280 }}>
                Add a dish from your recipe book and it lands here. Give it a day if you like, or just
                keep it for "soon".
              </T>
            </Card>
          ) : !picks.length ? (
            <T v="body" center color={colors.inkMuted}>
              Nothing matches {'“' + query.trim() + '”'}.
            </T>
          ) : (
            groups.map((g, gi) => (
              <View key={g.title ?? gi}>
                {g.title ? (
                  <T v="over" style={{ marginBottom: 6, marginTop: gi ? 6 : 0 }} color={g.title === 'Today' ? colors.coralDeep : undefined}>
                    {g.title}
                  </T>
                ) : null}
                {view === 'tiles' ? renderTiles(g.items) : renderList(g.items)}
              </View>
            ))
          )}

          {total ? (
            <>
              <Spacer h={6} />
              <Btn small tone="ghost" icon="cart-outline" label="Put what the picks need on the list" onPress={shopForPicks} />
              <T v="caption" center>
                Tap a dish for more. Hold it to {byDay ? 'move it to another day' : 'give it a day'}.
              </T>
            </>
          ) : null}
        </Screen>
      </KeyboardAvoidingView>

      {open ? (
        <PickSheet
          pick={open}
          byDay={byDay}
          onClose={() => setOpen(null)}
          onRecipe={() => {
            setOpen(null);
            router.push(`/recipe/${open.recipe.id}`);
          }}
          onCooked={() => {
            cookRecipe(open.recipe.id);
            setOpen(null);
            say(`Yum! ${open.recipe.name} is in your history`);
          }}
          onDay={() => {
            setMoving(open);
            setOpen(null);
          }}
          onRemove={() => {
            unplanMeal(open.meal.id);
            setOpen(null);
          }}
        />
      ) : null}

      {moving ? (
        <DaySheet
          title={moving.recipe.name}
          current={moving.meal.day}
          taken={mealPlan.filter((p) => p.recipeId === moving.recipe.id && p.id !== moving.meal.id).map((p) => p.day)}
          onClose={() => setMoving(null)}
          onPick={(d) => {
            setMealDay(moving.meal.id, d);
            setMoving(null);
            say(d ? `${moving.recipe.name} on ${dayLabel(d).toLowerCase()}` : `${moving.recipe.name} is for soon`);
          }}
        />
      ) : null}

      {adding ? (
        <BookSheet
          recipes={recipes}
          picked={picked}
          byDay={byDay}
          onClose={() => setAdding(false)}
          onPick={(r, day) => {
            planMeal(r.id, day);
            say(day ? `${r.name} on ${dayLabel(day).toLowerCase()}` : `${r.name} picked`);
          }}
          onNew={() => {
            setAdding(false);
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
        width: 32,
        height: 28,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: on ? colors.card : 'transparent',
      }}
    >
      <Ionicons name={icon} size={15} color={on ? colors.coralDeep : colors.inkMuted} />
    </Press>
  );
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <Pressable
      onPress={onClose}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#3D2836B8',
        justifyContent: 'flex-end',
      }}
    >
      <Pressable onPress={() => {}}>
        <Card style={{ margin: 12, padding: 18 }}>{children}</Card>
      </Pressable>
    </Pressable>
  );
}

/** What you can do with a pick. */
function PickSheet({
  pick,
  byDay,
  onClose,
  onRecipe,
  onCooked,
  onDay,
  onRemove,
}: {
  pick: Pick;
  byDay: boolean;
  onClose: () => void;
  onRecipe: () => void;
  onCooked: () => void;
  onDay: () => void;
  onRemove: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <Row style={{ gap: 10 }}>
        <View style={{ flex: 1 }}>
          <T v="over">{dayLabel(pick.meal.day)}</T>
          <Spacer h={4} />
          <T v="title" style={{ fontSize: 20 }}>
            {pick.recipe.name}
          </T>
        </View>
        <EffortMeter effort={pick.recipe.effort} size={12} />
      </Row>
      <Spacer h={16} />
      <Btn icon="sparkles" label="Cooked it!" onPress={onCooked} />
      <Spacer h={8} />
      <Row style={{ gap: 8 }}>
        <Btn style={{ flex: 1 }} small tone="quiet" icon="book-outline" label="Recipe" onPress={onRecipe} />
        <Btn
          style={{ flex: 1 }}
          small
          tone="quiet"
          icon="calendar-outline"
          label={pick.meal.day ? 'Change day' : byDay ? 'Give it a day' : 'A day?'}
          onPress={onDay}
        />
      </Row>
      <Spacer h={8} />
      <Btn small tone="ghost" icon="close" label="Take it off the picks" onPress={onRemove} />
    </Sheet>
  );
}

/** The whole book in a sheet, to pick from or to write a new one. */
function BookSheet({
  recipes,
  picked,
  byDay,
  onPick,
  onNew,
  onClose,
}: {
  recipes: Recipe[];
  picked: Set<string>;
  byDay: boolean;
  onPick: (r: Recipe, day?: string) => void;
  onNew: () => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [day, setDay] = useState<string | undefined>(undefined);
  const list = [...recipes]
    .filter((r) => !q.trim() || r.name.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (!!a.wanted !== !!b.wanted ? (a.wanted ? -1 : 1) : a.name.localeCompare(b.name)));

  return (
    <Sheet onClose={onClose}>
      <Row style={{ gap: 10 }}>
        <RecipeBookArt size={40} />
        <View style={{ flex: 1 }}>
          <T v="over">From your recipe book</T>
          <T v="heading">Pick something to cook</T>
        </View>
      </Row>
      {byDay ? (
        <>
          <Spacer h={10} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Row style={{ gap: 6 }}>
              {[undefined, ...nextDays(7)].map((d) => (
                <Press
                  key={d ?? 'none'}
                  onPress={() => setDay(d)}
                  style={{
                    paddingVertical: 7,
                    paddingHorizontal: 12,
                    borderRadius: radius.pill,
                    backgroundColor: d === day ? colors.coral : colors.cardAlt,
                  }}
                >
                  <T v="caption" color={d === day ? '#FFFFFF' : colors.inkSoft}>
                    {dayLabel(d)}
                  </T>
                </Press>
              ))}
            </Row>
          </ScrollView>
        </>
      ) : null}
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
        {list.map((r) => {
          const on = picked.has(r.id);
          return (
            <Press
              key={r.id}
              onPress={() => onPick(r, day)}
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
              <Ionicons name={on ? 'checkmark-circle' : 'add-circle-outline'} size={18} color={on ? colors.sageDeep : colors.coral} />
            </Press>
          );
        })}
        {!list.length ? (
          <T v="caption" center style={{ paddingVertical: 14 }}>
            {recipes.length ? 'Nothing matches.' : 'The book is empty.'}
          </T>
        ) : null}
      </ScrollView>
      <Spacer h={12} />
      <Row style={{ gap: 8 }}>
        <Btn style={{ flex: 1 }} small tone="quiet" icon="add" label="New into the book" onPress={onNew} />
        <Btn style={{ flex: 1 }} small tone="ghost" label="Done" onPress={onClose} />
      </Row>
    </Sheet>
  );
}
