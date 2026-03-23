export const getLatLng = (fieldValues, formComponents) => {
  try {
    const locationComponent = formComponents?.find(
      comp => comp.compTyp === "08"
    );

    if (!locationComponent?.fcId) {
      return { lat: null, lng: null };
    }

    const rawValue = fieldValues?.[locationComponent.fcId];
    if (!rawValue) {
      return { lat: null, lng: null };
    }

    const parsed = JSON.parse(rawValue);

    return {
      lat: parsed?.latitude ?? null,
      lng: parsed?.longitude ?? null,
    };
  } catch (error) {
    return { lat: null, lng: null };
  }
}