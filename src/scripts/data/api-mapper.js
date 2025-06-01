import Map from '../utils/map';

export async function storyMapper(story) {
  if (
    !story.location ||
    story.location.latitude === undefined ||
    story.location.longitude === undefined
  ) {
    return {
      ...story,
      location: {
        latitude: null,
        longitude: null,
        placeName: 'Lokasi tidak diketahui',
      },
    };
  }

  return {
    ...story,
    location: {
      ...story.location,
      placeName: await Map.getPlaceNameByCoordinate(
        story.location.latitude,
        story.location.longitude,
      ),
    },
  };
}
