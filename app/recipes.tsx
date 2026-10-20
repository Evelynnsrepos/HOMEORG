import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';

import { qtyLabel } from '../src/data/units';
import { lastDoneLabel } from '../src/lib/date';
import type { PantryItem, Recipe } from '../src/lib/types';
import { useStore } from '../src/state/store';
import { colors, font, radius } from '../src/theme';
import { Btn, Card, IconBtn, Press, Row, Screen, Spacer, T, tap } from '../src/ui/base';
import { KitchenTabs } from '../src/ui/KitchenTabs';
import { Toast } from '../src/ui/TaskRow';

/** A recipe with the pantry held up against it. */
type Sorted = {
  recipe: Recipe;
  parts: { name: string; have?: PantryItem }[];
  missing: string[];
};

/**
 * Not a week plan. A pool of the things you know how to cook, sorted by what
 * the kitchen can actually supply today. Writing one down happens on its own
 * screen — see src/ui/RecipeEditor.tsx.
 */
export default function Recipes() {
  const router = useRouter();

  const recipes = useStore((s) => s.recipes);
  const pantry = useStore((s) => s.pantry);
  const removeRecipe = useStore((s) => s.removeRecipe);
  const toggleWanted = useStore((s) => s.toggleWanted);
  const cookRecipe = useStore((s) => s.cookRecipe);
  const addShopping = useStore((s) => s.addShopping);

  const [query, setQuery] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function say(text: string) {
    setToast(text);
    setTimeout(() => setToast(null), 2600);
  }

  const all = useMemo(() => {
    /** Loose match, because "2 onions" and "onion" are the same thing to a cook. */
    const inStock = (name: string) => {
      const b = name.trim().toLowerCase();
      if (!b) return undefined;
      return pantry.find((p) => {
        const a = p.name.trim().toLowerCase();
        return a === b || a.includes(b) || b.includes(a);
      });
    };

    return recipes
      .map((recipe) => {
        const parts = recipe.ingredients.map((name) => ({ name, have: inStock(name) }));
        return { recipe, parts, missing: parts.filter((p) => !p.have).map((p) => p.name) };
      })
      .sort((a, b) => {
        if (!!a.recipe.wanted !== !!b.recipe.wanted) return a.recipe.wanted ? -1 : 1;
        if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
        // then whatever you have not made in the longest while
        return (a.recipe.lastCooked ?? '').localeCompare(b.recipe.lastCooked ?? '');
      });
  }, [recipes, pantry]);

  // counted over the whole book, so a search does not make the headline lie
  const readyNow = all.filter((c) => !c.missing.length).length;

  const cards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (c) =>
        c.recipe.name.toLowerCase().includes(q) ||
        c.recipe.ingredients.some((i) => i.toLowerCase().includes(q)),
    );
  }, [all, query]);

  /**
   * With an empty pantry everything would land under "needs a shop", which
   * tells you nothing at all. So the shelves have to hold something before the
   * list splits itself up.
   */
  const groups = pantry.length
    ? [
        {
          key: 'ready',
          title: 'You could cook this now',
          items: cards.filter((c) => !c.missing.length),
        },
        {
          key: 'close',
          title: 'One or two things short',
          items: cards.filter((c) => c.missing.length > 0 && c.missing.length <= 2),
        },
        {
          key: 'shop',
          title: 'Needs a shop first',
          items: cards.filter((c) => c.missing.length > 2),
        },
      ].filter((g) => g.items.length)
    : [{ key: 'all', title: '', items: cards }];

  /* ---- one recipe ----------------------------------------------------- */

  function renderCard(c: Sorted) {
    const r = c.recipe;
    const n = r.ingredients.length;
    const note = !n
      ? 'No ingredients written down'
      : !pantry.length
        ? n + (n === 1 ? ' ingredient' : ' ingredients')
        : !c.missing.length
          ? 'Everything is in the kitchen'
          : c.missing.length + ' of ' + n + ' still to buy';

    return (
      <Card key={r.id} style={{ padding: 14, marginBottom: 10 }}>
        <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Press
            style={{ flex: 1, paddingRight: 8 }}
            onPress={() => router.push(`/recipe/${r.id}`)}
          >
            <T v="heading">{r.name}</T>
            <Spacer h={2} />
            <T v="caption" color={!n || c.missing.length ? colors.inkMuted : colors.sageDeep}>
              {note}
            </T>
          </Press>
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
            <Spacer h={9} />
            <Row style={{ flexWrap: 'wrap', gap: 5 }}>
              {c.parts.map(({ name, have }) => (
                <Row
                  key={name}
                  style={{
                    backgroundColor: have ? colors.sageSoft : colors.cardAlt,
                    borderRadius: radius.pill,
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    gap: 4,
                  }}
                >
                  {have ? <Ionicons name="checkmark" size={10} color={colors.sageDeep} /> : null}
                  <T
                    v="caption"
                    style={{ fontSize: 11 }}
                    color={have ? colors.sageDeep : colors.inkMuted}
                  >
                    {name}
                    {have ? ' · ' + qtyLabel(have.qty, have.unit) : ''}
                  </T>
                </Row>
              ))}
            </Row>
          </>
        ) : null}

        <Spacer h={11} />
        <Row style={{ gap: 8 }}>
          {c.missing.length ? (
            <Btn
              small
              style={{ flex: 1 }}
              tone="quiet"
              icon="cart-outline"
              label={
                c.missing.length === n ? 'All to the list' : c.missing.length + ' to the list'
              }
              onPress={() => {
                c.missing.forEach((i) => addShopping(i, 1, r.name));
                say(c.missing.length + ' on the shopping list');
              }}
            />
          ) : null}
          <Btn
            small
            style={{ flex: 1 }}
            tone="sage"
            icon="restaurant-outline"
            label="Cooked it"
            onPress={() => {
              cookRecipe(r.id);
              say(pantry.length ? r.name + ' came off the shelves' : r.name + ' it is');
            }}
          />
        </Row>

        <Spacer h={9} />
        <Row style={{ gap: 14 }}>
          <Press
            onPress={() => {
              setConfirmId(null);
              router.push(`/recipe/${r.id}`);
            }}
          >
            <T v="caption" color={colors.coralDeep}>
              Edit
            </T>
          </Press>
          <Press
            onPress={() => {
              if (confirmId === r.id) {
                removeRecipe(r.id);
                setConfirmId(null);
              } else setConfirmId(r.id);
            }}
          >
            <T v="caption" color={confirmId === r.id ? colors.ember : colors.inkMuted}>
              {confirmId === r.id ? 'Tap again to remove' : 'Remove'}
            </T>
          </Press>
          <View style={{ flex: 1 }} />
          {r.lastCooked ? (
            <T v="caption" color={colors.inkMuted}>
              Last cooked {lastDoneLabel(r.lastCooked)}
            </T>
          ) : null}
        </Row>
      </Card>
    );
  }

  /* ---- screen ---------------------------------------------------------- */

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
          <KitchenTabs active="recipes" />

          <Spacer h={16} />
          <T v="display" style={{ fontSize: 28 }}>
            What could{'\n'}you cook?
          </T>
          <Spacer h={6} />
          <T v="label">
            {!recipes.length
              ? 'Your own little book of dishes.'
              : pantry.length
                ? recipes.length + ' written down · ' + readyNow + ' you could make right now'
                : recipes.length + ' written down. Fill the pantry and this list sorts itself.'}
          </T>

          <Spacer h={16} />
          <Btn icon="add" label="Add a recipe" onPress={() => router.push('/recipe/new')} />

          {recipes.length >= 6 ? (
            <>
              <Spacer h={10} />
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
                  placeholder="Find a dish or an ingredient"
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
            </>
          ) : null}

          <Spacer h={16} />

          {!recipes.length ? (
            <Card soft style={{ padding: 20, alignItems: 'center' }}>
              <T style={{ fontSize: 30 }}>{'\u{1F372}'}</T>
              <Spacer h={8} />
              <T v="heading" center>
                Nothing in the book yet
              </T>
              <Spacer h={6} />
              <T v="body" center style={{ maxWidth: 280 }}>
                Write down a dish and what goes in it. Homeorg&lt;3 holds it against the pantry and
                tells you which ones you could make tonight.
              </T>
            </Card>
          ) : !cards.length ? (
            <T v="body" center color={colors.inkMuted}>
              Nothing matches {'“' + query.trim() + '”'}.
            </T>
          ) : (
            groups.map((g) => (
              <View key={g.key}>
                {g.title ? (
                  <>
                    <Row style={{ gap: 7 }}>
                      <T v="over">{g.title}</T>
                      <T v="over" color={colors.inkMuted}>
                        {g.items.length}
                      </T>
                    </Row>
                    <Spacer h={8} />
                  </>
                ) : null}
                {g.items.map(renderCard)}
                <Spacer h={10} />
              </View>
            ))
          )}
        </Screen>
      </KeyboardAvoidingView>
      {toast ? <Toast text={toast} bottom={30} /> : null}
    </View>
  );
}
