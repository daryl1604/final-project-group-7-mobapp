import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, BackHandler, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import AppHeader from "../../components/common/AppHeader";
import PrimaryButton from "../../components/common/PrimaryButton";
import ScreenContainer from "../../components/common/ScreenContainer";
import FormField from "../../components/forms/FormField";
import { INCIDENT_TYPES, PUROK_OPTIONS } from "../../constants/appConstants";
import { getStoredJson, removeStoredJson, setStoredJson } from "../../storage/asyncStorageHelpers";
import { useApp } from "../../storage/AppProvider";
import { getCurrentTime, getTodayDate } from "../../utils/dateUtils";
import useKeyboardAwareFieldFocus from "../../utils/useKeyboardAwareFieldFocus";

const MAX_PHOTOS = 5;
const MIN_DESCRIPTION_LENGTH = 10;
const MEANINGFUL_TEXT_PATTERN = /[\p{L}\p{N}]/u;
const SUBMIT_REPORT_DRAFT_KEY_PREFIX = "@barangay_finals_submit_report_draft";
const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];
const DEFAULT_REGION = {
  latitude: 13.9411,
  longitude: 121.1633,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

function createDefaultForm() {
  return {
    incidentType: "",
    description: "",
    purok: "",
    date: getTodayDate(),
    time: getCurrentTime(),
    photoUri: "",
    photoUris: [],
    location: {
      latitude: null,
      longitude: null,
      address: "",
    },
  };
}

function normalizeDraftForm(form = {}) {
  const photoUris = Array.isArray(form.photoUris) ? form.photoUris.filter(Boolean).slice(0, MAX_PHOTOS) : [];

  return {
    incidentType: form.incidentType || "",
    description: form.description || "",
    purok: form.purok || "",
    date: form.date || getTodayDate(),
    time: form.time || getCurrentTime(),
    photoUri: form.photoUri || photoUris[0] || "",
    photoUris,
    location: {
      latitude: form.location?.latitude ?? null,
      longitude: form.location?.longitude ?? null,
      address: form.location?.address || "",
    },
  };
}

function getFormSignature(form) {
  const normalizedForm = normalizeDraftForm(form);

  return JSON.stringify({
    incidentType: normalizedForm.incidentType,
    description: normalizedForm.description,
    purok: normalizedForm.purok,
    date: normalizedForm.date,
    time: normalizedForm.time,
    photoUri: normalizedForm.photoUri,
    photoUris: normalizedForm.photoUris,
    location: normalizedForm.location,
  });
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function parseDateValue(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateValue(date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

function formatPickerDateLabel(value) {
  return parseDateValue(value).toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPickerTimeLabel(value) {
  const [hours, minutes] = value.split(":").map(Number);
  const timeValue = new Date(2026, 0, 1, hours, minutes);

  return timeValue.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function normalizeDateDraft(dateDraft) {
  const totalDays = getDaysInMonth(dateDraft.year, dateDraft.month);

  return {
    ...dateDraft,
    day: Math.min(dateDraft.day, totalDays),
  };
}

function getDateDraftFromValue(value) {
  const date = parseDateValue(value);

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function buildYearOptions(selectedYear) {
  const currentYear = new Date().getFullYear();
  const startYear = Math.min(currentYear - 2, selectedYear - 2);
  const endYear = Math.max(currentYear + 5, selectedYear + 2);
  const options = [];

  for (let year = startYear; year <= endYear; year += 1) {
    options.push({ value: year, label: String(year) });
  }

  return options;
}

function buildDayOptions(year, month) {
  return Array.from({ length: getDaysInMonth(year, month) }, (_, index) => ({
    value: index + 1,
    label: String(index + 1),
  }));
}

function getTimeDraftFromValue(value) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return {
    hour: Number.isNaN(hours) ? 0 : hours,
    minute: Number.isNaN(minutes) ? 0 : minutes,
  };
}

function formatTimeDraftValue(timeDraft) {
  return `${padNumber(timeDraft.hour)}:${padNumber(timeDraft.minute)}`;
}

function buildHourOptions() {
  return Array.from({ length: 24 }, (_, hour) => ({
    value: hour,
    label: padNumber(hour),
  }));
}

function buildMinuteOptions() {
  return Array.from({ length: 60 }, (_, minute) => ({
    value: minute,
    label: padNumber(minute),
  }));
}

const INCIDENT_OPTIONS = [
  { label: "Trash Complaint", value: "Trash Complaint", icon: "trash-outline", tint: "#55d88c" },
  { label: "Noise Complaint", value: "Noise Complaint", icon: "volume-high-outline", tint: "#55d88c" },
  { label: "Broken Streetlight", value: "Broken Streetlight", icon: "bulb-outline", tint: "#55d88c" },
  { label: "Drainage Concern", value: "Drainage Concern", icon: "git-network-outline", tint: "#55d88c" },
  { label: "Public Disturbance", value: "Public Disturbance", icon: "warning-outline", tint: "#55d88c" },
  { label: "Water Leak", value: "Water Leak", icon: "water-outline", tint: "#55d88c" },
  { label: "Road Damage", value: "Road Damage", icon: "construct-outline", tint: "#55d88c" },
  { label: "Illegal Parking", value: "Illegal Parking", icon: "car-outline", tint: "#55d88c" },
  { label: "Other", value: "Other", icon: "apps-outline", tint: "#55d88c" },
];

const PUROK_SELECTOR_OPTIONS = PUROK_OPTIONS.map((item) => ({
  label: item,
  value: item,
  icon: "location-outline",
  tint: "#6f8eff",
}));

function DropdownField({ label, value, options, onChange, placeholder, styles, theme, defaultIcon, defaultTint, error = "" }) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);
  const iconName = selectedOption?.icon || defaultIcon;
  const iconTint = selectedOption?.tint || defaultTint || theme.primary;

  return (
    <>
      <View style={styles.dropdownField}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Pressable style={[styles.dropdownTrigger, error ? styles.dropdownTriggerError : null]} onPress={() => setOpen(true)}>
          {iconName ? (
            <View style={[styles.dropdownIconShell, { backgroundColor: `${iconTint}20` }]}>
              <Ionicons name={iconName} size={18} color={iconTint} />
            </View>
          ) : null}
          <Text style={[styles.dropdownValue, !selectedOption ? { color: theme.placeholder } : null]} numberOfLines={1}>
            {selectedOption?.label || placeholder}
          </Text>
          <Ionicons name="chevron-down" size={18} color={theme.textMuted} />
        </Pressable>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => null}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalOptions} contentContainerStyle={styles.modalOptionsContent} showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const active = option.value === value;

                return (
                  <Pressable
                    key={`${label}-${option.value}`}
                    style={[styles.modalOption, active ? styles.modalOptionActive : null]}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <View style={[styles.modalOptionIcon, { backgroundColor: `${option.tint || theme.primary}20` }]}>
                      <Ionicons name={option.icon || "chevron-forward"} size={16} color={option.tint || theme.primary} />
                    </View>
                    <Text style={[styles.modalOptionText, active ? styles.modalOptionTextActive : null]}>{option.label}</Text>
                    {active ? <Ionicons name="checkmark" size={18} color={theme.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function PickerField({ label, value, placeholder, iconName, onPress, styles, theme }) {
  return (
    <View style={styles.compactPairField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.pickerTrigger} onPress={onPress}>
        <Text style={[styles.pickerTriggerValue, !value ? { color: theme.placeholder } : null]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name={iconName} size={18} color={theme.textSoft} />
      </Pressable>
    </View>
  );
}

function DatePickerColumn({ title, options, selectedValue, onSelect, styles }) {
  return (
    <View style={styles.datePickerColumn}>
      <Text style={styles.datePickerColumnTitle}>{title}</Text>
      <ScrollView
        style={styles.datePickerColumnScroll}
        contentContainerStyle={styles.datePickerColumnContent}
        showsVerticalScrollIndicator={false}
      >
        {options.map((option) => {
          const active = option.value === selectedValue;

          return (
            <Pressable
              key={`${title}-${option.value}`}
              style={[styles.datePickerOption, active ? styles.datePickerOptionActive : null]}
              onPress={() => onSelect(option.value)}
            >
              <Text style={[styles.datePickerOptionText, active ? styles.datePickerOptionTextActive : null]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function TimePickerColumn({ title, options, selectedValue, onSelect, styles }) {
  return (
    <View style={styles.timePickerColumn}>
      <Text style={styles.datePickerColumnTitle}>{title}</Text>
      <ScrollView
        style={styles.timePickerColumnScroll}
        contentContainerStyle={styles.datePickerColumnContent}
        showsVerticalScrollIndicator={false}
      >
        {options.map((option) => {
          const active = option.value === selectedValue;

          return (
            <Pressable
              key={`${title}-${option.value}`}
              style={[styles.datePickerOption, active ? styles.datePickerOptionActive : null]}
              onPress={() => onSelect(option.value)}
            >
              <Text style={[styles.datePickerOptionText, active ? styles.datePickerOptionTextActive : null]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function SubmitReportScreen({ navigation }) {
  const { currentUser, submitReport, showAlert, theme, openDrawer } = useApp();
  const scrollRef = useRef(null);
  const sectionOffsetsRef = useRef({});
  const restorePromptShownRef = useRef(false);
  const suppressTouchedRef = useRef(false);
  const { width } = useWindowDimensions();
  const { handleFieldFocus, focusField, registerInputRef } = useKeyboardAwareFieldFocus({ scrollRef });
  const [form, setForm] = useState(() => createDefaultForm());
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapDraftLocation, setMapDraftLocation] = useState(null);
  const [pickerModal, setPickerModal] = useState({ visible: false, mode: "date" });
  const [dateDraft, setDateDraft] = useState(() => getDateDraftFromValue(getTodayDate()));
  const [timeDraft, setTimeDraft] = useState(() => getTimeDraftFromValue(getCurrentTime()));
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationLoadingLabel, setLocationLoadingLabel] = useState("");
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [savedFormSignature, setSavedFormSignature] = useState(() => getFormSignature(createDefaultForm()));
  const styles = createStyles(theme, width < 390);
  const draftStorageKey = `${SUBMIT_REPORT_DRAFT_KEY_PREFIX}:${currentUser?.id || "guest"}`;

  const errors = useMemo(
    () => {
      const trimmedDescription = form.description.trim();

      return {
        incidentType: form.incidentType ? "" : "Please select an incident type.",
        purok: form.purok ? "" : "Please select a purok.",
        description: !trimmedDescription
          ? "Please describe the incident."
          : !MEANINGFUL_TEXT_PATTERN.test(trimmedDescription)
            ? "Description must contain meaningful text"
            : trimmedDescription.length < MIN_DESCRIPTION_LENGTH
              ? `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`
            : "",
        location: form.location.address ? "" : "Please capture the report location.",
      };
    },
    [form.description, form.incidentType, form.location.address, form.purok]
  );

  const hasUnsavedChanges = useMemo(() => getFormSignature(form) !== savedFormSignature, [form, savedFormSignature]);
  const photoCount = form.photoUris.length;
  const hourOptions = useMemo(() => buildHourOptions(), []);
  const minuteOptions = useMemo(() => buildMinuteOptions(), []);
  const yearOptions = useMemo(() => buildYearOptions(dateDraft.year), [dateDraft.year]);
  const dayOptions = useMemo(() => buildDayOptions(dateDraft.year, dateDraft.month), [dateDraft.year, dateDraft.month]);
  const showError = (field) => (touched[field] ? errors[field] : "");
  const updateField = (key, value) => {
    suppressTouchedRef.current = false;
    setForm((current) => ({ ...current, [key]: value }));
  };
  const markFieldTouched = (field) => {
    if (suppressTouchedRef.current) {
      return;
    }

    setTouched((current) => ({ ...current, [field]: true }));
  };
  const resetFormState = (nextForm = createDefaultForm()) => {
    const normalizedForm = normalizeDraftForm(nextForm);

    setForm(normalizedForm);
    setTouched({});
    setMapDraftLocation(null);
    setMapModalOpen(false);
    setPickerModal({ visible: false, mode: "date" });
    setDateDraft(getDateDraftFromValue(normalizedForm.date));
    setTimeDraft(getTimeDraftFromValue(normalizedForm.time));
    return normalizedForm;
  };
  const registerSectionOffset = (key) => (event) => {
    sectionOffsetsRef.current[key] = event.nativeEvent.layout.y;
  };
  const scrollToSection = (key) => {
    const y = Math.max((sectionOffsetsRef.current[key] || 0) - 24, 0);
    scrollRef.current?.scrollTo({ y, animated: true });
  };
  const openPicker = (mode) => {
    if (mode === "date") {
      setDateDraft(getDateDraftFromValue(form.date));
    }

    if (mode === "time") {
      setTimeDraft(getTimeDraftFromValue(form.time));
    }

    setPickerModal({ visible: true, mode });
  };
  const closePicker = () => setPickerModal((current) => ({ ...current, visible: false }));
  const applyDateDraft = () => {
    updateField("date", formatDateValue(new Date(dateDraft.year, dateDraft.month - 1, dateDraft.day)));
    closePicker();
  };
  const applyTimeDraft = () => {
    updateField("time", formatTimeDraftValue(timeDraft));
    closePicker();
  };
  const focusFirstError = () => {
    if (errors.incidentType || errors.purok) {
      scrollToSection("details");
      return;
    }

    if (errors.description) {
      if (!focusField("description")) {
        scrollToSection("description");
      }
      return;
    }

    if (errors.location) {
      scrollToSection("location");
    }
  };
  const saveDraft = async (draftForm = form) => {
    const normalizedForm = normalizeDraftForm(draftForm);
    await setStoredJson(draftStorageKey, normalizedForm);
    setSavedFormSignature(getFormSignature(normalizedForm));
    setIsDraftSaved(true);
    return normalizedForm;
  };
  const clearDraft = async ({ resetForm = false } = {}) => {
    await removeStoredJson(draftStorageKey);
    const defaultForm = createDefaultForm();

    if (resetForm) {
      resetFormState(defaultForm);
    }

    setSavedFormSignature(getFormSignature(defaultForm));
    setIsDraftSaved(false);
    return defaultForm;
  };
  const handleBackPress = useCallback(() => {
    if (!hasUnsavedChanges) {
      navigation.goBack();
      return;
    }

    showAlert(
      "Unsaved Report",
      "You have unfinished changes. Do you want to save this as a draft or discard it?",
      {
        variant: "info",
        buttons: [
        {
          text: "Save Draft",
          variant: "primary",
          onPress: async () => {
            await saveDraft();
            navigation.goBack();
          },
        },
        {
          text: "Discard",
          variant: "danger",
          onPress: async () => {
            suppressTouchedRef.current = true;
            await clearDraft({ resetForm: true });
            navigation.goBack();
          },
        },
      ],
      }
    );
  }, [clearDraft, hasUnsavedChanges, navigation, saveDraft, showAlert]);

  useEffect(() => {
    let mounted = true;

    const restoreDraft = async () => {
      if (!currentUser?.id || restorePromptShownRef.current) {
        return;
      }

      restorePromptShownRef.current = true;
      const storedDraft = await getStoredJson(draftStorageKey, null);

      if (!mounted || !storedDraft) {
        if (mounted) {
          setSavedFormSignature(getFormSignature(createDefaultForm()));
          setIsDraftSaved(false);
        }
        return;
      }

      showAlert("Continue your draft?", "We found a saved draft for this report. Would you like to continue it or discard it?", {
        variant: "info",
        dismissible: false,
        buttons: [
          {
            text: "Discard Draft",
            variant: "danger",
            onPress: async () => {
              await clearDraft({ resetForm: true });
            },
          },
          {
            text: "Continue",
            variant: "primary",
            onPress: async () => {
              const normalizedDraft = normalizeDraftForm(storedDraft);
              resetFormState(normalizedDraft);
              setSavedFormSignature(getFormSignature(normalizedDraft));
              setIsDraftSaved(true);
            },
          },
        ],
      });
    };

    restoreDraft();

    return () => {
      mounted = false;
    };
  }, [currentUser?.id, draftStorageKey, showAlert]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (!hasUnsavedChanges) {
          return false;
        }

        handleBackPress();
        return true;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        subscription.remove();
      };
    }, [handleBackPress, hasUnsavedChanges])
  );

  const syncPhotoState = (photoUris) => {
    setForm((current) => ({
      ...current,
      photoUris,
      photoUri: photoUris[0] || "",
    }));
  };

  const appendPhotos = (uris) => {
    const nextUris = [...form.photoUris, ...uris.filter(Boolean)].slice(0, MAX_PHOTOS);
    syncPhotoState(nextUris);
  };

  const handlePickGallery = async () => {
    if (photoCount >= MAX_PHOTOS) {
      showAlert("Photo limit reached", `You can add up to ${MAX_PHOTOS} photos only.`, { variant: "info" });
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showAlert("Permission needed", "Please allow image access to attach photos.", { variant: "danger" });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.6,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photoCount,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      appendPhotos((result.assets || []).map((asset) => asset.uri));
    }
  };

  const handleTakePhoto = async () => {
    if (photoCount >= MAX_PHOTOS) {
      showAlert("Photo limit reached", `You can add up to ${MAX_PHOTOS} photos only.`, { variant: "info" });
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      showAlert("Permission needed", "Please allow camera access to attach a photo.", { variant: "danger" });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true });

    if (!result.canceled) {
      appendPhotos([result.assets[0].uri]);
    }
  };

  const removePhoto = (uri) => {
    syncPhotoState(form.photoUris.filter((item) => item !== uri));
  };

  const captureLocation = async ({ openMapAfter = false } = {}) => {
    setLocationLoading(true);
    setLocationLoadingLabel(openMapAfter ? "Getting location..." : "Getting location...");

    try {
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

      const nextLocation = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
        address: addressLabel,
      };

      updateField("location", nextLocation);
      setTouched((current) => ({ ...current, location: true }));

      if (openMapAfter) {
        setMapDraftLocation(nextLocation);
        setMapModalOpen(true);
      }
    } catch (error) {
      showAlert("Unable to get location", "Please try again in a moment.", { variant: "danger" });
    } finally {
      setLocationLoading(false);
      setLocationLoadingLabel("");
    }
  };

  const openAdjustMap = async () => {
    if (form.location.latitude && form.location.longitude) {
      setLocationLoading(true);
      setLocationLoadingLabel("Opening map...");
      setMapDraftLocation(form.location);
      requestAnimationFrame(() => {
        setMapModalOpen(true);
        setLocationLoading(false);
        setLocationLoadingLabel("");
      });
      return;
    }

    await captureLocation({ openMapAfter: true });
  };

  const saveAdjustedLocation = async () => {
    if (!mapDraftLocation?.latitude || !mapDraftLocation?.longitude) {
      return;
    }

    const addresses = await Location.reverseGeocodeAsync({
      latitude: mapDraftLocation.latitude,
      longitude: mapDraftLocation.longitude,
    });
    const firstAddress = addresses[0];
    const addressLabel = firstAddress
      ? [firstAddress.name, firstAddress.street, firstAddress.district, firstAddress.city].filter(Boolean).join(", ")
      : form.location.address || "Adjusted map location";

    updateField("location", {
      latitude: mapDraftLocation.latitude,
      longitude: mapDraftLocation.longitude,
      address: addressLabel,
    });
    setMapModalOpen(false);
  };

  const updateDraftCoordinate = (coordinate) => {
    if (!coordinate?.latitude || !coordinate?.longitude) {
      return;
    }

    setMapDraftLocation((current) => ({
      ...(current || form.location || {}),
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    }));
  };

  const handleMapPress = (event) => {
    const coordinate = event?.nativeEvent?.coordinate;
    updateDraftCoordinate(coordinate);
  };

  const handleMarkerDragEnd = (event) => {
    const coordinate = event?.nativeEvent?.coordinate;
    updateDraftCoordinate(coordinate);
  };

  const handleSubmit = async () => {
    setTouched({ incidentType: true, purok: true, description: true, location: true });

    if (Object.values(errors).some(Boolean)) {
      focusFirstError();
      return;
    }

    try {
      setSubmitting(true);
      await submitReport({
        residentId: currentUser.id,
        incidentType: form.incidentType || INCIDENT_TYPES[0],
        description: form.description,
        purok: form.purok,
        date: form.date,
        time: form.time,
        photoUri: form.photoUris[0] || "",
        photoUris: form.photoUris,
        location: form.location,
      });
      await removeStoredJson(draftStorageKey);
      showAlert("Report submitted", "Your incident report has been saved successfully.", { variant: "success" });
      const nextForm = resetFormState(createDefaultForm());
      setSavedFormSignature(getFormSignature(nextForm));
      setIsDraftSaved(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ScreenContainer scrollRef={scrollRef} keyboardShouldPersistTaps="handled" contentStyle={styles.screenContent}>
        <AppHeader title="Submit Report" variant="toolbar" onLeftPress={openDrawer} />

        <View style={styles.sectionCard} onLayout={registerSectionOffset("details")}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="information-circle-outline" size={22} color={theme.primary} />
            <Text style={styles.sectionTitle}>Incident Details</Text>
          </View>

          <View style={styles.compactPairRow}>
            <View style={styles.compactPairField}>
              <DropdownField
                label="Incident Type"
                value={form.incidentType}
                onChange={(value) => {
                  updateField("incidentType", value);
                  markFieldTouched("incidentType");
                }}
                options={INCIDENT_OPTIONS}
                placeholder="Select incident type"
                styles={styles}
                theme={theme}
                defaultIcon="warning-outline"
                defaultTint="#55d88c"
                error={showError("incidentType")}
              />
            </View>
            <View style={styles.compactPairField}>
              <DropdownField
                label="Purok"
                value={form.purok}
                onChange={(value) => {
                  updateField("purok", value);
                  markFieldTouched("purok");
                }}
                options={PUROK_SELECTOR_OPTIONS}
                placeholder="Select purok"
                styles={styles}
                theme={theme}
                defaultIcon="location-outline"
                defaultTint="#6f8eff"
                error={showError("purok")}
              />
            </View>
          </View>

          <View style={styles.compactPairRow}>
            <PickerField label="Date" value={form.date} placeholder="YYYY-MM-DD" iconName="calendar-outline" onPress={() => openPicker("date")} styles={styles} theme={theme} />
            <PickerField label="Time" value={form.time} placeholder="HH:MM" iconName="time-outline" onPress={() => openPicker("time")} styles={styles} theme={theme} />
          </View>

          <View style={styles.descriptionHeader}>
            <View>
              <Text style={styles.fieldLabel}>Description</Text>
              <Text style={styles.fieldHint}>Provide as much detail as possible</Text>
            </View>
          </View>
          <FormField
            label=""
            value={form.description}
            onChangeText={(value) => updateField("description", value)}
            onBlur={() => markFieldTouched("description")}
            onFocus={handleFieldFocus("description")}
            inputRef={registerInputRef("description")}
            onLayout={registerSectionOffset("description")}
            error={showError("description")}
            placeholder="Describe the incident clearly..."
            multiline
          />
        </View>

        <View style={[styles.sectionCard, styles.photosCard]}>
          <View style={styles.photoHeaderBlock}>
            <View style={styles.photoHeaderTopRow}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="images-outline" size={22} color="#7c3aed" />
                <Text style={styles.sectionTitle}>Attach Photos</Text>
                <Text style={styles.optionalLabel}>(Optional)</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{`${photoCount} photo${photoCount === 1 ? "" : "s"} attached`}</Text>
              </View>
            </View>
            <Text style={styles.sectionHintText}>Clear photos help us understand the issue faster.</Text>
          </View>

          <View style={styles.mediaButtonRow}>
            <Pressable style={styles.mediaButton} onPress={handlePickGallery}>
              <Ionicons name="images-outline" size={18} color="#6a5ce6" />
              <Text style={styles.mediaButtonText}>Choose from Gallery</Text>
            </Pressable>
            <Pressable style={styles.mediaButton} onPress={handleTakePhoto}>
              <Ionicons name="camera-outline" size={18} color="#6a5ce6" />
              <Text style={styles.mediaButtonText}>Take Photo</Text>
            </Pressable>
          </View>

          <View style={styles.uploadZone}>
            {photoCount ? (
              <View style={styles.photoGrid}>
                {form.photoUris.map((uri) => (
                  <View key={uri} style={styles.photoCard}>
                    <Image source={{ uri }} style={styles.photoPreview} resizeMode="cover" />
                    <Pressable style={styles.removePhotoButton} onPress={() => removePhoto(uri)}>
                      <Ionicons name="close" size={14} color="#ffffff" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.uploadEmptyState}>
                <View style={styles.uploadEmptyIconWrap}>
                  <Ionicons name="images-outline" size={34} color="#9b8cf8" />
                  <View style={styles.uploadEmptyPlus}>
                    <Ionicons name="add" size={12} color="#ffffff" />
                  </View>
                </View>
                <Text style={styles.uploadEmptyTitle}>No photos attached yet</Text>
                <Text style={styles.uploadEmptyText}>You can add up to 5 photos</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.sectionCard, styles.locationSectionCard]} onLayout={registerSectionOffset("location")}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="locate-outline" size={22} color={theme.success} />
            <Text style={styles.sectionTitle}>Report Location</Text>
            <Text style={styles.requiredLabel}>(Required)</Text>
          </View>
          <Text style={styles.sectionHintText}>Capture or adjust the exact location on the map.</Text>

          <Pressable style={[styles.captureLocationButton, locationLoading ? styles.captureLocationButtonDisabled : null]} onPress={() => captureLocation()} disabled={locationLoading}>
            {locationLoading ? <ActivityIndicator size="small" color={theme.success} /> : <Ionicons name="locate-outline" size={18} color={theme.success} />}
            <Text style={styles.captureLocationButtonText}>{locationLoadingLabel || "Capture Current Location"}</Text>
          </Pressable>

          <View style={styles.locationInfoRow}>
            <View style={styles.locationInfoCopy}>
              <Ionicons name="location-outline" size={18} color={theme.textSoft} />
              <Text style={styles.locationInfoText} numberOfLines={2}>
                {form.location.address || "No location captured yet"}
              </Text>
            </View>
            <Pressable style={[styles.adjustMapLink, locationLoading ? styles.adjustMapLinkDisabled : null]} onPress={openAdjustMap} disabled={locationLoading}>
              {locationLoading ? <ActivityIndicator size="small" color={theme.success} /> : null}
              <Text style={styles.adjustMapText}>{locationLoading && locationLoadingLabel ? locationLoadingLabel : "Adjust on map"}</Text>
              {!locationLoading ? <Ionicons name="chevron-forward" size={16} color={theme.success} /> : null}
            </Pressable>
          </View>
          {showError("location") ? <Text style={styles.errorText}>{showError("location")}</Text> : null}
        </View>

        <View style={styles.submitWrap}>
          <PrimaryButton label={submitting ? "Saving..." : "Submit Report"} onPress={handleSubmit} loading={submitting} />
          <Text style={styles.submitHelper}>We&apos;ll review your report and take appropriate action.</Text>
        </View>
      </ScreenContainer>

      <Modal visible={pickerModal.visible} transparent animationType="fade" onRequestClose={closePicker}>
        <Pressable style={styles.modalBackdrop} onPress={closePicker}>
          <Pressable style={styles.modalSheet} onPress={() => null}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pickerModal.mode === "date" ? "Select Date" : "Select Time"}</Text>
              <Pressable onPress={closePicker} hitSlop={8}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>

            {pickerModal.mode === "date" ? (
              <>
                <Text style={styles.datePickerSummary}>{formatPickerDateLabel(formatDateValue(new Date(dateDraft.year, dateDraft.month - 1, dateDraft.day)))}</Text>
                <View style={styles.datePickerColumns}>
                  <DatePickerColumn
                    title="Month"
                    options={MONTH_OPTIONS}
                    selectedValue={dateDraft.month}
                    onSelect={(month) => setDateDraft((current) => normalizeDateDraft({ ...current, month }))}
                    styles={styles}
                  />
                  <DatePickerColumn
                    title="Day"
                    options={dayOptions}
                    selectedValue={dateDraft.day}
                    onSelect={(day) => setDateDraft((current) => ({ ...current, day }))}
                    styles={styles}
                  />
                  <DatePickerColumn
                    title="Year"
                    options={yearOptions}
                    selectedValue={dateDraft.year}
                    onSelect={(year) => setDateDraft((current) => normalizeDateDraft({ ...current, year }))}
                    styles={styles}
                  />
                </View>
                <Pressable style={styles.datePickerApplyButton} onPress={applyDateDraft}>
                  <Text style={styles.datePickerApplyButtonText}>Apply Date</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.datePickerSummary}>{formatPickerTimeLabel(formatTimeDraftValue(timeDraft))}</Text>
                <View style={styles.timePickerColumns}>
                  <TimePickerColumn
                    title="Hour"
                    options={hourOptions}
                    selectedValue={timeDraft.hour}
                    onSelect={(hour) => setTimeDraft((current) => ({ ...current, hour }))}
                    styles={styles}
                  />
                  <TimePickerColumn
                    title="Minute"
                    options={minuteOptions}
                    selectedValue={timeDraft.minute}
                    onSelect={(minute) => setTimeDraft((current) => ({ ...current, minute }))}
                    styles={styles}
                  />
                </View>
                <Pressable style={styles.datePickerApplyButton} onPress={applyTimeDraft}>
                  <Text style={styles.datePickerApplyButtonText}>Apply Time</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={mapModalOpen} animationType="slide" onRequestClose={() => setMapModalOpen(false)}>
        <View style={styles.mapModalShell}>
          <View style={styles.mapModalHeader}>
            <Text style={styles.mapModalTitle}>Adjust Location</Text>
            <Pressable onPress={() => setMapModalOpen(false)} hitSlop={8}>
              <Text style={styles.modalClose}>Close</Text>
            </Pressable>
          </View>
          <MapView
            style={styles.mapView}
            initialRegion={
              mapDraftLocation?.latitude && mapDraftLocation?.longitude
                ? {
                    latitude: mapDraftLocation.latitude,
                    longitude: mapDraftLocation.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }
                : DEFAULT_REGION
            }
            onPress={handleMapPress}
          >
            {mapDraftLocation?.latitude && mapDraftLocation?.longitude ? (
              <Marker
                coordinate={{
                  latitude: mapDraftLocation.latitude,
                  longitude: mapDraftLocation.longitude,
                }}
                draggable
                onDragEnd={handleMarkerDragEnd}
              />
            ) : null}
          </MapView>
          <View style={styles.mapFooter}>
            <Text style={styles.mapFooterText}>Drag the pin or tap the map to adjust the exact location.</Text>
            <PrimaryButton label="Save Adjusted Location" onPress={saveAdjustedLocation} />
          </View>
        </View>
      </Modal>
    </>
  );
}

function createStyles(theme, isCompact = false) {
  return StyleSheet.create({
    screenContent: {
      gap: 14,
      paddingBottom: 144,
    },
    sectionCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 16,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 3,
    },
    photosCard: {
      backgroundColor: theme.mode === "dark" ? "#16152a" : "#fbfaff",
      borderColor: theme.mode === "dark" ? "rgba(139, 92, 246, 0.22)" : theme.border,
    },
    locationSectionCard: {
      backgroundColor: theme.mode === "dark" ? "#11241d" : "#f8fffb",
      borderColor: theme.mode === "dark" ? "rgba(52, 211, 153, 0.22)" : theme.border,
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    sectionHeaderBetween: {
      flexDirection: isCompact ? "column" : "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    photoHeaderBlock: {
      gap: 6,
    },
    photoHeaderTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "900",
    },
    optionalLabel: {
      color: theme.textSoft,
      fontSize: 14,
      fontWeight: "700",
    },
    requiredLabel: {
      color: theme.textSoft,
      fontSize: 14,
      fontWeight: "700",
    },
    sectionHintText: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 2,
    },
    row: {
      flexDirection: isCompact ? "column" : "row",
      gap: 12,
    },
    compactPairRow: {
      flexDirection: "row",
      gap: isCompact ? 10 : 12,
    },
    halfField: {
      flex: 1,
      position: "relative",
      minWidth: 0,
    },
    compactPairField: {
      flex: 1,
      position: "relative",
      minWidth: 0,
    },
    dropdownField: {
      gap: 8,
    },
    pickerTrigger: {
      minHeight: isCompact ? 54 : 58,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      paddingHorizontal: isCompact ? 12 : 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: isCompact ? 8 : 10,
    },
    pickerTriggerValue: {
      flex: 1,
      color: theme.text,
      fontSize: isCompact ? 13 : 15,
      fontWeight: "700",
    },
    fieldLabel: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "800",
    },
    fieldHint: {
      color: theme.textSoft,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 2,
    },
    dropdownTrigger: {
      minHeight: isCompact ? 54 : 58,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      paddingHorizontal: isCompact ? 12 : 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: isCompact ? 8 : 10,
    },
    dropdownTriggerError: {
      borderColor: theme.danger,
    },
    dropdownIconShell: {
      width: isCompact ? 36 : 40,
      height: isCompact ? 36 : 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    dropdownValue: {
      flex: 1,
      color: theme.text,
      fontSize: isCompact ? 13 : 14,
      fontWeight: "800",
      textAlign: "left",
    },
    inlineFieldIcon: {
      position: "absolute",
      right: 14,
      bottom: 16,
      zIndex: 1,
    },
    descriptionHeader: {
      marginBottom: -8,
    },
    countBadge: {
      minHeight: 28,
      paddingHorizontal: isCompact ? 10 : 12,
      borderRadius: 999,
      backgroundColor: theme.mode === "dark" ? "rgba(124, 92, 230, 0.18)" : "rgba(124, 92, 230, 0.12)",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    countBadgeText: {
      color: "#7c3aed",
      fontSize: isCompact ? 11 : 12,
      fontWeight: "800",
    },
    mediaButtonRow: {
      flexDirection: "row",
      gap: isCompact ? 10 : 12,
    },
    mediaButton: {
      flex: 1,
      minHeight: isCompact ? 46 : 48,
      borderRadius: 16,
      backgroundColor: theme.mode === "dark" ? "rgba(16, 27, 46, 0.92)" : "#ffffff",
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(148, 163, 184, 0.22)" : theme.border,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: isCompact ? 8 : 10,
      minWidth: 0,
    },
    mediaButtonText: {
      color: "#6a5ce6",
      fontSize: isCompact ? 13 : 14,
      fontWeight: "800",
      textAlign: "center",
      flexShrink: 1,
    },
    uploadZone: {
      minHeight: 164,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(167, 139, 250, 0.32)" : "#d8d2f5",
      borderStyle: "dashed",
      backgroundColor: theme.mode === "dark" ? "rgba(18, 35, 60, 0.7)" : "rgba(255,255,255,0.72)",
      padding: 14,
      justifyContent: "center",
    },
    uploadEmptyState: {
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    uploadEmptyIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 24,
      backgroundColor: theme.mode === "dark" ? "rgba(124, 92, 230, 0.14)" : "rgba(124, 92, 230, 0.08)",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    uploadEmptyPlus: {
      position: "absolute",
      right: 10,
      bottom: 10,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#8b5cf6",
      alignItems: "center",
      justifyContent: "center",
    },
    uploadEmptyTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "900",
    },
    uploadEmptyText: {
      color: theme.textMuted,
      fontSize: 14,
      textAlign: "center",
    },
    photoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    photoCard: {
      width: "31%",
      aspectRatio: 1,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: theme.surfaceSoft,
      position: "relative",
    },
    photoPreview: {
      width: "100%",
      height: "100%",
    },
    removePhotoButton: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "rgba(15, 23, 42, 0.66)",
      alignItems: "center",
      justifyContent: "center",
    },
    captureLocationButton: {
      minHeight: 52,
      borderRadius: 16,
      backgroundColor: theme.mode === "dark" ? "rgba(5, 150, 105, 0.18)" : "rgba(5, 150, 105, 0.12)",
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(52, 211, 153, 0.18)" : "transparent",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    captureLocationButtonDisabled: {
      opacity: 0.82,
    },
    captureLocationButtonText: {
      color: theme.success,
      fontSize: 15,
      fontWeight: "900",
    },
    locationInfoRow: {
      minHeight: 56,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(148, 163, 184, 0.22)" : theme.border,
      backgroundColor: theme.mode === "dark" ? "rgba(16, 27, 46, 0.92)" : "#ffffff",
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    locationInfoCopy: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minWidth: 0,
    },
    locationInfoText: {
      flex: 1,
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
    },
    adjustMapLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flexShrink: 0,
    },
    adjustMapLinkDisabled: {
      opacity: 0.82,
    },
    adjustMapText: {
      color: theme.success,
      fontSize: 14,
      fontWeight: "900",
    },
    submitWrap: {
      gap: 8,
      paddingTop: 4,
    },
    submitHelper: {
      color: theme.textMuted,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 18,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.56)",
      justifyContent: "center",
      padding: 20,
    },
    modalSheet: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 14,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    modalTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
    },
    modalClose: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
    },
    modalOptions: {
      flexGrow: 0,
    },
    modalOptionsContent: {
      gap: 8,
    },
    datePickerSummary: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "800",
      textAlign: "center",
    },
    datePickerColumns: {
      flexDirection: "row",
      gap: 10,
      maxHeight: 320,
    },
    datePickerColumn: {
      flex: 1,
      minWidth: 0,
      gap: 8,
    },
    timePickerColumns: {
      flexDirection: "row",
      gap: 12,
      maxHeight: 320,
    },
    timePickerColumn: {
      flex: 1,
      minWidth: 0,
      gap: 8,
    },
    datePickerColumnTitle: {
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: "800",
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    datePickerColumnScroll: {
      flexGrow: 0,
    },
    timePickerColumnScroll: {
      flexGrow: 0,
    },
    datePickerColumnContent: {
      gap: 8,
    },
    datePickerOption: {
      minHeight: 44,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
    },
    datePickerOptionActive: {
      backgroundColor: theme.primarySoft,
      borderColor: theme.primary,
    },
    datePickerOptionText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
    },
    datePickerOptionTextActive: {
      color: theme.primary,
    },
    datePickerApplyButton: {
      minHeight: 48,
      borderRadius: 18,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    datePickerApplyButtonText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "800",
    },
    modalOption: {
      minHeight: 50,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    modalOptionActive: {
      backgroundColor: theme.primarySoft,
      borderColor: theme.primary,
    },
    modalOptionIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    modalOptionText: {
      flex: 1,
      color: theme.text,
      fontSize: 14,
      fontWeight: "700",
    },
    modalOptionTextActive: {
      color: theme.primary,
    },
    errorText: {
      color: theme.danger,
      fontSize: 12,
    },
    mapModalShell: {
      flex: 1,
      backgroundColor: theme.background,
    },
    mapModalHeader: {
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
    },
    mapModalTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "900",
    },
    mapView: {
      flex: 1,
    },
    mapFooter: {
      backgroundColor: theme.surface,
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 18,
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    mapFooterText: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 18,
      textAlign: "center",
    },
  });
}
