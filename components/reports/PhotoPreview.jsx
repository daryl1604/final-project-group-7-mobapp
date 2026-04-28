import { Image, ScrollView, Text, View } from "react-native";
import { useApp } from "../../storage/AppProvider";
import { createPhotoPreviewStyles } from "../../styles/reports/PhotoPreview.styles";

export default function PhotoPreview({ uri, uris = [] }) {
  const { theme } = useApp();
  const styles = createPhotoPreviewStyles(theme);
  const imageUris = (Array.isArray(uris) && uris.length ? uris : uri ? [uri] : []).filter(Boolean);

  if (!imageUris.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No photo attached</Text>
      </View>
    );
  }

  if (imageUris.length === 1) {
    return <Image source={{ uri: imageUris[0] }} style={styles.image} resizeMode="cover" />;
  }

  return (
    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
      {imageUris.map((imageUri) => (
        <Image key={imageUri} source={{ uri: imageUri }} style={styles.galleryImage} resizeMode="cover" />
      ))}
    </ScrollView>
  );
}
