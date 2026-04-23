import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import FormField from "../../components/forms/FormField";
import OptionSelector from "../../components/forms/OptionSelector";
import ReportCard from "../../components/reports/ReportCard";
import { REPORT_SORT_OPTIONS, REPORT_STATUSES } from "../../constants/appConstants";
import { useApp } from "../../storage/AppProvider";

export default function MyReportsScreen({ navigation, route }) {
  const { currentUser, reports, theme } = useApp();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("");
  const styles = createStyles(theme);
  const handledSelectionRef = useRef(null);

  const residentReports = useMemo(() => {
    const filtered = reports.filter((report) => {
      if (report.residentId !== currentUser.id) {
        return false;
      }

      if (statusFilter && report.status !== statusFilter) {
        return false;
      }

      const combined = `${report.incidentType} ${report.description} ${report.purok}`.toLowerCase();
      return combined.includes(search.toLowerCase());
    });

    if (sortBy === "oldest") {
      return [...filtered].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    if (sortBy === "status") {
      return [...filtered].sort((a, b) => a.status.localeCompare(b.status));
    }

    if (sortBy === "type") {
      return [...filtered].sort((a, b) => a.incidentType.localeCompare(b.incidentType));
    }

    return [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [currentUser.id, reports, search, sortBy, statusFilter]);

  useEffect(() => {
    const selectedReportId = route?.params?.selectedReportId;
    const selectionKey = route?.params?.selectionKey;

    if (!selectedReportId || !selectionKey || handledSelectionRef.current === selectionKey) {
      return;
    }

    handledSelectionRef.current = selectionKey;
    navigation.navigate("ResidentReportDetails", { reportId: selectedReportId });
  }, [navigation, route?.params?.selectedReportId, route?.params?.selectionKey]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        handledSelectionRef.current = null;
        if (route?.params?.selectedReportId || route?.params?.selectionKey) {
          navigation.setParams({
            selectedReportId: undefined,
            selectionKey: undefined,
          });
        }
      };
    }, [navigation, route?.params?.selectedReportId, route?.params?.selectionKey])
  );

  return (
    <ScreenContainer keyboardShouldPersistTaps="handled">
      <AppHeader title="My Reports" variant="toolbar" />
      <View style={styles.filterCard}>
        <FormField label="Search" value={search} onChangeText={setSearch} placeholder="Search incident, purok, or details" />
        <OptionSelector label="Sort by" value={sortBy} onChange={setSortBy} options={REPORT_SORT_OPTIONS} />
        <OptionSelector
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{ label: "All status", value: "" }, ...REPORT_STATUSES.map((status) => ({ label: status, value: status }))]}
        />
        <Pressable style={styles.resetButton} onPress={() => { setSearch(""); setSortBy("newest"); setStatusFilter(""); }}>
          <Text style={styles.resetButtonText}>Reset filters</Text>
        </Pressable>
      </View>
      {residentReports.map((report) => (
        <ReportCard key={report.id} report={report} onPress={() => navigation.navigate("ResidentReportDetails", { reportId: report.id })} />
      ))}
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    filterCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 14,
    },
    resetButton: {
      alignSelf: "flex-start",
      backgroundColor: theme.primarySoft,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
    },
    resetButtonText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
    },
  });
}
