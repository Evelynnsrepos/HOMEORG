import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';

import { useStore } from '../src/state/store';
import { colors } from '../src/theme';
import { Btn, Card, Empty, IconBtn, Press, Row, Screen, Spacer, T } from '../src/ui/base';
import { Field } from '../src/ui/TaskFields';

export default function Notes() {
  const router = useRouter();
  const notes = useStore((s) => s.notes);
  const add = useStore((s) => s.addNote);
  const remove = useStore((s) => s.removeNote);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={() => router.back()} />
          <T v="heading">Pinned info</T>
          <IconBtn name={open ? 'close' : 'add'} onPress={() => setOpen((v) => !v)} />
        </Row>

        <Spacer h={10} />
        <T v="display" style={{ fontSize: 28 }}>
          The things you{'\n'}always forget.
        </T>
        <Spacer h={6} />
        <T v="label">Wifi codes, bin days, which switch is the boiler.</T>

        {open ? (
          <>
            <Spacer h={18} />
            <Card>
              <Field label="Title" value={title} onChangeText={setTitle} placeholder="Bin days" />
              <Spacer h={14} />
              <Field
                label="Details"
                value={body}
                onChangeText={setBody}
                placeholder="Green Tuesday, blue every other Friday"
                multiline
              />
              <Spacer h={14} />
              <Btn
                label="Pin it"
                disabled={!title.trim()}
                onPress={() => {
                  add(title.trim(), body.trim());
                  setTitle('');
                  setBody('');
                  setOpen(false);
                }}
              />
            </Card>
          </>
        ) : null}

        <Spacer h={18} />
        {notes.length === 0 ? (
          <Empty
            emoji={'\u{1F4CC}'}
            title="Nothing pinned yet"
            body="Tap the plus to add the first one."
          />
        ) : (
          notes.map((n) => (
            <Card key={n.id} style={{ padding: 15, marginBottom: 10 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T v="heading" style={{ flex: 1 }}>
                  {n.title}
                </T>
                <Press
                  onPress={() =>
                    Alert.alert('Remove this note?', n.title, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => remove(n.id) },
                    ])
                  }
                >
                  <T v="caption" color={colors.inkMuted}>
                    Remove
                  </T>
                </Press>
              </Row>
              {n.body ? (
                <>
                  <Spacer h={6} />
                  <T v="body">{n.body}</T>
                </>
              ) : null}
            </Card>
          ))
        )}
        <View />
      </Screen>
    </KeyboardAvoidingView>
  );
}
