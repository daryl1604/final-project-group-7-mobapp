import { useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import PrimaryButton from "../../components/common/PrimaryButton";
import ScreenContainer from "../../components/common/ScreenContainer";
import FormField from "../../components/forms/FormField";
import OptionSelector from "../../components/forms/OptionSelector";
import { INCIDENT_TYPES, PUROK_OPTIONS } from "../../constants/appConstants";
import { useApp } from "../../storage/AppProvider";
import useKeyboardAwareFieldFocus from "../../utils/useKeyboardAwareFieldFocus";

export default function EditReportScreen({ route, navigation }) {
  const { reportId } = route.params;
  const { reports, updateResidentReport, showAlert, theme } = useApp();
  const report = useMemo(() => reports.find((item) => item.id === reportId), [reportId, reports]);
  const scrollRef = useRef(null);
  const { handleFieldFocus, registerInputRef } = useKeyboardAwareFieldFocus({ scrollRef });
  const [form, setForm] = useState(
    report || {
      incidentType: INCIDENT_TYPES[0],
      purok: PUROK_OPTIONS[0],
      description: "",
      date: "",
      time: "",
    }
  );
  const [touched, setTouched] = useState({});
  const styles = createStyles(theme);

  if (!report) {
    return null;
  }

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const descriptionError = touched.description && !form.description.trim() ? "Please update the incident description." : "";

  const handleSave = async () => {
    setTouched({ description: true });
    if (!form.description.trim()) {
      return;
    }

    await updateResidentReport(report.id, form);
    showAlert("Report updated", "Your local report changes were saved.", {
      variant: "success",
      buttons: [
        {
          text: "OK",
          variant: "primary",
          onPress: () => navigation.goBack(),
        },
      ],
    });
  };

  return (
    <ScreenContainer scrollRef={scrollRef} keyboardShouldPersistTaps="handled">
      <AppHeader title="Edit Report" variant="toolbar" />
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Report details</Text>
        <OptionSelector label="Incident type" value={form.incidentType} onChange={(value) => updateField("incidentType", value)} options={INCIDENT_TYPES} />
        <OptionSelector label="Purok" value={form.purok} onChange={(value) => updateField("purok", value)} options={PUROK_OPTIONS} />
        <FormField label="Date" value={form.date} onChangeText={(value) => updateField("date", value)} placeholder="YYYY-MM-DD" />
        <FormField label="Time" value={form.time} onChangeText={(value) => updateField("time", value)} placeholder="HH:MM" />
        <FormField
          label="Description"
          value={form.description}
          onChangeText={(value) => updateField("description", value)}
          onBlur={() => setTouched({ description: true })}
          onFocus={handleFieldFocus("description")}
          inputRef={registerInputRef("description")}
          error={descriptionError}
          placeholder="Update the incident description"
          multiline
        />
      </View>
      <PrimaryButton label="Save changes" onPress={handleSave} />
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
    sectionTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "800",
    },
  });
}
