import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import FormField from "../../components/forms/FormField";
import OptionSelector from "../../components/forms/OptionSelector";
import ReportCard from "../../components/reports/ReportCard";
import { REPORT_SORT_OPTIONS, REPORT_STATUSES } from "../../constants/appConstants";
import { useApp } from "../../storage/AppProvider";

export default function AllReportsScreen({ navigation }) {
  const { reports, theme } = useApp();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("");
  const [incidentFilter, setIncidentFilter] = useState("");
  const [purokFilter, setPurokFilter] = useState("");
  const styles = createStyles(theme);

  const incidentOptions = useMemo(
    () => [
      { label: "All incidents", value: "" },
      ...[...new Set(reports.map((item) => item.incidentType))].map((item) => ({ label: item, value: item })),
    ],
    [reports]
  );

  const purokOptions = useMemo(
    () => [
      { label: "All puroks", value: "" },
      ...[...new Set(reports.map((item) => item.purok))].map((item) => ({ label: item, value: item })),
    ],
    [reports]
  );

  const filteredReports = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const nextItems = reports.filter((report) => {
      if (statusFilter && report.status !== statusFilter) {
        return false;
      }

      if (incidentFilter && report.incidentType !== incidentFilter) {
        return false;
      }

      if (purokFilter && report.purok !== purokFilter) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      const combined = [
        report.residentName,
        report.purok,
        report.incidentType,
        report.description,
        report.location?.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return combined.includes(searchValue);
    });

    if (sortBy === "oldest") {
      return [...nextItems].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    if (sortBy === "status") {
      return [...nextItems].sort((a, b) => a.status.localeCompare(b.status));
    }

    if (sortBy === "type") {
      return [...nextItems].sort((a, b) => a.incidentType.localeCompare(b.incidentType));
    }

    return [...nextItems].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [incidentFilter, purokFilter, reports, search, sortBy, statusFilter]);

  const resetFilters = () => {
    setSearch("");
    setSortBy("newest");
    setStatusFilter("");
    setIncidentFilter("");
    setPurokFilter("");
  };

  return (
    <ScreenContainer keyboardShouldPersistTaps="handled">
      <AppHeader title="Reports" variant="toolbar" />

      <View style={styles.filterCard}>
        <FormField
          label="Search reports"
          value={search}
          onChangeText={setSearch}
          placeholder="Search resident name, purok, incident, or details"
        />
        <OptionSelector label="Sort by" value={sortBy} onChange={setSortBy} options={REPORT_SORT_OPTIONS} />
        <OptionSelector
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{ label: "All status", value: "" }, ...REPORT_STATUSES.map((status) => ({ label: status, value: status }))]}
        />
        <OptionSelector label="Incident type" value={incidentFilter} onChange={setIncidentFilter} options={incidentOptions} />
        <OptionSelector label="Purok" value={purokFilter} onChange={setPurokFilter} options={purokOptions} />
        <Pressable style={styles.resetButton} onPress={resetFilters}>
          <Text style={styles.resetButtonText}>Reset filters</Text>
        </Pressable>
      </View>

      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>{filteredReports.length} matching report{filteredReports.length === 1 ? "" : "s"}</Text>
      </View>

      {filteredReports.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          onPress={() => navigation.navigate("AdminReportDetails", { reportId: report.id })}
        />
      ))}

      {filteredReports.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No reports found</Text>
          <Text style={styles.emptyText}>Try changing the search terms or clearing the active filters.</Text>
        </View>
      ) : null}
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
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    resetButtonText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
    },
    resultHeader: {
      paddingHorizontal: 2,
    },
    resultTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800",
    },
    emptyState: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      gap: 6,
      alignItems: "center",
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
    },
    emptyText: {
      color: theme.textMuted,
      textAlign: "center",
      lineHeight: 20,
    },
  });
}
