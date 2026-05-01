import { Image, Text, View } from "react-native";
import { useApp } from "../../storage/AppProvider";
import { createPhotoPreviewStyles } from "../../styles/reports/PhotoPreview.styles";

export default function PhotoPreview({ uri }) {
  const { theme } = useApp();
  const styles = createPhotoPreviewStyles(theme);

  if (!uri) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No photo attached</Text>
      </View>
    );
  }

  return <Image source={{ uri }} style={styles.image} resizeMode="cover" />;
}
