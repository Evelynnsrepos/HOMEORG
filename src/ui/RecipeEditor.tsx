import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { qtyLabel } from '../data/units';
import { effortLabel } from '../lib/kitchen';
import type { PantryItem, RecipeEffort, RecipeExtra } from '../lib/types';
import { useStore } from '../state/store';
import { colors, font, radius } from '../theme';
import { Btn, Card, Chip, IconBtn, Press, Row, Screen, Spacer, T, tap } from './base';
import { EffortMeter } from './Kitchen';

const TIMES = [10, 20, 30, 45, 60, 90, 120, 180];

/** Something you can tap instead of typing it out. */
type Suggestion = { name: string; note?: string; onShelf?: boolean };

/**
 * A whole screen for one recipe, so the keyboard never sits on top of what you
 * are writing. Ingredients go in one at a time — type and press +, or tap one
 * off the shelves.
 */
export function RecipeEditor({ id }: { id?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const recipes = useStore((s) => s.recipes);
  const pantry = useStore((s) => s.pantry);
  const addRecipe = useStore((s) => s.addRecipe);
  const updateRecipe = useStore((s) => s.updateRecipe);
  const removeRecipe = useStore((s) => s.removeRecipe);

  const existing = id ? recipes.find((r) => r.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [list, setList] = useState<string[]>(existing?.ingredients ?? []);
  const [draft, setDraft] = useState('');
  const [minutes, setMinutes] = useState<number | undefined>(existing?.minutes);
  const [effort, setEffort] = useState<RecipeEffort | undefined>(existing?.effort);
  const [steps, setSteps] = useState(existing?.steps ?? '');
  const [link, setLink] = useState(existing?.link ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  /** Loose match, because "2 onions" and "onion" are the same thing to a cook. */
  function onShelf(ingredient: string): PantryItem | undefined {
    const b = ingredient.trim().toLowerCase();
    if (!b) return undefined;
    return pantry.find((p) => {
      const a = p.name.trim().toLowerCase();
      return a === b || a.includes(b) || b.includes(a);
    });
  }

  /** Adding what is already in the list would just make a duplicate row. */
  function merge(into: string[], raw: string): string[] {
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const out = [...into];
    const have = new Set(out.map((i) => i.toLowerCase()));
    for (const p of parts) {
      if (have.has(p.toLowerCase())) continue;
      have.add(p.toLowerCase());
      out.push(p);
    }
    return out;
  }

  function add(raw: string) {
    if (!raw.trim()) return;
    setList((l) => merge(l, raw));
    setDraft('');
    tap();
  }

  const suggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    const chosen = new Set(list.map((i) => i.trim().toLowerCase()));
    const seen = new Set<string>();
    const shelves: Suggestion[] = [];
    const used: Suggestion[] = [];

    // the kitchen first — that is the whole point of having a pantry
    for (const p of pantry) {
      const key = p.name.trim().toLowerCase();
      if (!key || chosen.has(key) || seen.has(key) || (q && !key.includes(q))) continue;
      seen.add(key);
      shelves.push({ name: p.name.trim(), note: qtyLabel(p.qty, p.unit), onShelf: true });
    }
    // then anything you have written into another recipe before
    for (const r of recipes) {
      if (existing && r.id === existing.id) continue;
      for (const i of r.ingredients) {
        const key = i.trim().toLowerCase();
        if (!key || chosen.has(key) || seen.has(key) || (q && !key.includes(q))) continue;
        seen.add(key);
        used.push({ name: i.trim() });
      }
    }
    return [...shelves, ...used].slice(0, 30);
  }, [pantry, recipes, list, draft, existing]);

  /** Deep-linked straight here? Then there is no screen behind this one. */
  function leave() {
    if (router.canGoBack()) router.back();
    else router.replace('/recipes');
  }

  function save() {
    const clean = name.trim();
    if (!clean) return;
    // a half-typed line counts too, nobody expects to lose it on save
    const final = draft.trim() ? merge(list, draft) : list;
    const extra: RecipeExtra = {
      minutes,
      effort,
      steps: steps.trim() || undefined,
      link: link.trim() || undefined,
    };
    if (existing) updateRecipe(existing.id, clean, final, extra);
    else addRecipe(clean, final, extra);
    leave();
  }

  if (id && !existing) {
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Screen keyboardShouldPersistTaps="handled" bottom={20}>
          <Row style={{ justifyContent: 'space-between' }}>
            <IconBtn name="chevron-back" onPress={leave} />
            <T v="heading">{existing ? 'Edit recipe' : 'New recipe'}</T>
            <View style={{ width: 38 }} />
          </Row>

          <Spacer h={18} />
          <T v="over">What do you cook?</T>
          <Spacer h={7} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Curry, pancakes, that soup"
            placeholderTextColor={colors.inkMuted}
            autoFocus={!existing}
            style={{
              backgroundColor: colors.card,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.line,
              paddingHorizontal: 14,
              paddingVertical: 13,
              fontFamily: font.bold,
              fontSize: 18,
              color: colors.ink,
            }}
          />

          <Spacer h={22} />
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="over">Ingredients</T>
            <T v="caption" color={colors.inkMuted}>
              {list.length ? `${list.length} in the list` : 'none yet'}
            </T>
          </Row>

          <Spacer h={8} />
          <Row style={{ gap: 8 }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="One thing at a time"
              placeholderTextColor={colors.inkMuted}
              returnKeyType="done"
              blurOnSubmit={false}
              onSubmitEditing={() => add(draft)}
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.line,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontFamily: font.medium,
                fontSize: 15,
                color: colors.ink,
              }}
            />
            <Pressable
              onPress={() => add(draft)}
              style={({ pressed }) => ({
                width: 46,
                height: 46,
                borderRadius: 23,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: draft.trim() ? colors.coral : colors.cardAlt,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons name="add" size={24} color={draft.trim() ? '#FFF8F2' : colors.inkMuted} />
            </Pressable>
          </Row>

          {list.length ? (
            <>
              <Spacer h={10} />
              <Card style={{ padding: 4 }}>
                {list.map((ing, i) => {
                  const have = onShelf(ing);
                  return (
                    <Row
                      key={`${ing}-${i}`}
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
                      <View style={{ flex: 1 }}>
                        <T v="body" color={colors.ink}>
                          {ing}
                        </T>
                        {have ? (
                          <T v="caption" color={colors.sageDeep}>
                            {qtyLabel(have.qty, have.unit)} in the kitchen
                          </T>
                        ) : null}
                      </View>
                      <Press
                        hitSlop={10}
                        onPress={() => {
                          tap();
                          setList((l) => l.filter((_, at) => at !== i));
                        }}
                      >
                        <Ionicons name="close" size={17} color={colors.inkMuted} />
                      </Press>
                    </Row>
                  );
                })}
              </Card>
            </>
          ) : null}

          {suggestions.length ? (
            <>
              <Spacer h={18} />
              <T v="over">{draft.trim() ? 'Did you mean' : 'Straight off your shelves'}</T>
              <Spacer h={4} />
              <T v="caption">
                {draft.trim()
                  ? 'Tap one, or press + to use exactly what you typed.'
                  : 'Tap to add. The green ones are in the kitchen right now.'}
              </T>
              <Spacer h={9} />
              <Row style={{ flexWrap: 'wrap', gap: 6 }}>
                {suggestions.map((s) => (
                  <Pressable
                    key={s.name}
                    onPress={() => add(s.name)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      paddingVertical: 7,
                      paddingHorizontal: 11,
                      borderRadius: radius.pill,
                      backgroundColor: s.onShelf ? colors.sageSoft : colors.card,
                      borderWidth: 1,
                      borderColor: s.onShelf ? colors.sageSoft : colors.line,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Ionicons
                      name="add"
                      size={12}
                      color={s.onShelf ? colors.sageDeep : colors.inkMuted}
                    />
                    <T v="caption" color={s.onShelf ? colors.sageDeep : colors.inkSoft}>
                      {s.name}
                      {s.note ? ` · ${s.note}` : ''}
                    </T>
                  </Pressable>
                ))}
              </Row>
            </>
          ) : null}

          <Spacer h={24} />
          <T v="over">How long does it take?</T>
          <Spacer h={8} />
          <Row style={{ flexWrap: 'wrap', gap: 6 }}>
            {TIMES.map((m) => (
              <Chip
                key={m}
                small
                label={m < 60 ? `${m} min` : `${m / 60}${m % 60 ? '.5' : ''} h`}
                active={minutes === m}
                onPress={() => setMinutes(minutes === m ? undefined : m)}
              />
            ))}
          </Row>

          <Spacer h={22} />
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="over">Effort</T>
            {effort ? <EffortMeter effort={effort} /> : null}
          </Row>
          <Spacer h={8} />
          <Row style={{ gap: 6 }}>
            {([1, 2, 3] as RecipeEffort[]).map((e) => (
              <Chip
                key={e}
                small
                label={effortLabel[e]}
                active={effort === e}
                onPress={() => setEffort(effort === e ? undefined : e)}
              />
            ))}
          </Row>

          <Spacer h={22} />
          <T v="over">How you make it</T>
          <Spacer h={8} />
          <TextInput
            value={steps}
            onChangeText={setSteps}
            multiline
            placeholder={'One step per line.\nOnions in first, then...'}
            placeholderTextColor={colors.inkMuted}
            style={{
              minHeight: 110,
              textAlignVertical: 'top',
              backgroundColor: colors.card,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.line,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontFamily: font.medium,
              fontSize: 15,
              color: colors.ink,
            }}
          />
          <Spacer h={10} />
          <TextInput
            value={link}
            onChangeText={setLink}
            placeholder="Or paste a link to it"
            placeholderTextColor={colors.inkMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={{
              backgroundColor: colors.card,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.line,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontFamily: font.medium,
              fontSize: 15,
              color: colors.ink,
            }}
          />

          {existing ? (
            <>
              <Spacer h={26} />
              <Btn
                tone="ghost"
                label={confirmDelete ? 'Tap again to delete it' : 'Delete this recipe'}
                onPress={() => {
                  if (!confirmDelete) return setConfirmDelete(true);
                  removeRecipe(existing.id);
                  leave();
                }}
              />
            </>
          ) : null}
        </Screen>

        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: insets.bottom + 10,
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.lineSoft,
          }}
        >
          <Btn
            label={existing ? 'Save' : 'Add to the book'}
            disabled={!name.trim()}
            onPress={save}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
