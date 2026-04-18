import { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import AppHeader from "../../components/common/AppHeader";
import PrimaryButton from "../../components/common/PrimaryButton";
import ScreenContainer from "../../components/common/ScreenContainer";
import FormField from "../../components/forms/FormField";
import OptionSelector from "../../components/forms/OptionSelector";
import PhotoPreview from "../../components/reports/PhotoPreview";
import { INCIDENT_TYPES, PUROK_OPTIONS } from "../../constants/appConstants";
import { useApp } from "../../storage/AppProvider";
import { getCurrentTime, getTodayDate } from "../../utils/dateUtils";
import useKeyboardAwareFieldFocus from "../../utils/useKeyboardAwareFieldFocus";

export default function SubmitReportScreen() {
  const { currentUser, submitReport, showAlert, theme } = useApp();
  const scrollRef = useRef(null);
  const { handleFieldFocus, registerInputRef } = useKeyboardAwareFieldFocus({ scrollRef });
  const [form, setForm] = useState({
    incidentType: INCIDENT_TYPES[0],
    description: "",
    purok: currentUser?.purok || PUROK_OPTIONS[0],
    date: getTodayDate(),
    time: getCurrentTime(),
    photoUri: "",
    location: {
      latitude: null,
      longitude: null,
      address: "",
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const styles = createStyles(theme);

  const errors = useMemo(
    () => ({
      description: form.description.trim() ? "" : "Please describe the incident.",
      location: form.location.address ? "" : "Please capture the report location.",
    }),
    [form.description, form.location.address]
  );

  const showError = (field) => touched[field] ? errors[field] : "";
  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handlePickImage = async (useCamera) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showAlert("Permission needed", "Please allow image access to attach a photo.", { variant: "danger" });
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: true });

    if (!result.canceled) {
      updateField("photoUri", result.assets[0].uri);
    }
  };

  const captureLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      showAlert("Permission needed", "Please allow location access to capture your incident address.", { variant: "danger" });
      return;
    }

    const currentPosition = await Location.getCurrentPositionAsync({});
    const addresses = await Location.reverseGeocodeAsync(currentPosition.coords);
    const firstAddress = addresses[0];
    const addressLabel = firstAddress
      ? [firstAddress.name, firstAddress.street, firstAddress.district, firstAddress.city].filter(Boolean).join(", ")
      : "Current device location";

    updateField("location", {
      latitude: currentPosition.coords.latitude,
      longitude: currentPosition.coords.longitude,
      address: addressLabel,
    });
  };

  const handleSubmit = async () => {
    setTouched({ description: true, location: true });

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    try {
      setSubmitting(true);
      await submitReport({
        residentId: currentUser.id,
        ...form,
      });
      showAlert("Report submitted", "Your incident report has been saved successfully.", { variant: "success" });
      setForm({
        incidentType: INCIDENT_TYPES[0],
        description: "",
        purok: currentUser?.purok || PUROK_OPTIONS[0],
        date: getTodayDate(),
        time: getCurrentTime(),
        photoUri: "",
        location: {
          latitude: null,
          longitude: null,
          address: "",
        },
      });
      setTouched({});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer scrollRef={scrollRef} keyboardShouldPersistTaps="handled">
      <AppHeader title="Submit Report" variant="toolbar" />

      <View style={styles.card}>
        <OptionSelector label="Incident type" value={form.incidentType} onChange={(value) => updateField("incidentType", value)} options={INCIDENT_TYPES} />
        <OptionSelector label="Purok" value={form.purok} onChange={(value) => updateField("purok", value)} options={PUROK_OPTIONS} />
        <FormField label="Date" value={form.date} onChangeText={(value) => updateField("date", value)} placeholder="YYYY-MM-DD" />
        <FormField label="Time" value={form.time} onChangeText={(value) => updateField("time", value)} placeholder="HH:MM" />
        <FormField
          label="Description"
          value={form.description}
          onChangeText={(value) => updateField("description", value)}
          onBlur={() => setTouched((current) => ({ ...current, description: true }))}
          onFocus={handleFieldFocus("description")}
          inputRef={registerInputRef("description")}
          error={showError("description")}
          placeholder="Describe the incident clearly"
          multiline
        />

        <View style={styles.buttonRow}>
          <Pressable style={styles.secondaryButton} onPress={() => handlePickImage(false)}>
            <Text style={styles.secondaryButtonText}>Pick from gallery</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => handlePickImage(true)}>
            <Text style={styles.secondaryButtonText}>Use camera</Text>
          </Pressable>
        </View>

        <PhotoPreview uri={form.photoUri} />

        <Pressable style={styles.locationButton} onPress={captureLocation}>
          <Text style={styles.locationButtonText}>
            {form.location.address ? "Refresh location" : "Capture location"}
          </Text>
        </Pressable>
        <Text style={styles.locationText}>{form.location.address || "No location captured yet."}</Text>
        {showError("location") ? <Text style={styles.errorText}>{showError("location")}</Text> : null}
      </View>

      <PrimaryButton
        label={submitting ? "Saving..." : "Submit report"}
        onPress={handleSubmit}
        loading={submitting}
      />
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 14,
    },
    buttonRow: {
      flexDirection: "row",
      gap: 10,
    },
    secondaryButton: {
      flex: 1,
      minHeight: 46,
      borderRadius: 16,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
    },
    secondaryButtonText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
    },
    locationButton: {
      minHeight: 48,
      borderRadius: 16,
      backgroundColor: theme.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    locationButtonText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: "800",
    },
    locationText: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    errorText: {
      color: theme.danger,
      fontSize: 12,
    },
  });
}
