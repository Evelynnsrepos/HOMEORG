import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { RecipeEditor } from '../../src/ui/RecipeEditor';

export default function EditRecipe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RecipeEditor id={id} />;
}
