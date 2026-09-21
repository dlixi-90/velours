export const restoreProductDraft = (draft, categories, selection) => {
  if (!draft) return undefined;
  const categoryId = selection?.categoryId || draft.categoryId;
  const category = categories.find((item) => item._id === categoryId);
  if (!category) return draft;
  const selectedTypeId = selection?.typeId || (categoryId === draft.categoryId ? draft.typeId : null);
  const type = category.types?.find((item) => item._id === selectedTypeId);
  const previousType = category.types?.find((item) => item.name === draft.inputs.type);
  return {
    ...draft,
    inputs: {
      ...draft.inputs,
      category: category.name,
      type: type?.name || previousType?.name || "",
    },
  };
};
