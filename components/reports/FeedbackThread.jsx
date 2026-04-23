import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useApp } from "../../storage/AppProvider";
import { createFeedbackThreadStyles } from "../../styles/reports/FeedbackThread.styles";

function ThreadCard({ title, text, author, createdAt, styles }) {
  const [expanded, setExpanded] = useState(false);
  const showToggle = String(text || "").trim().length > 120;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardText} numberOfLines={expanded ? undefined : 3}>{text}</Text>
      {showToggle ? (
        <Pressable onPress={() => setExpanded((current) => !current)}>
          <Text style={styles.toggleText}>{expanded ? "See less" : "See more"}</Text>
        </Pressable>
      ) : null}
      <Text style={styles.cardMeta}>
        {author} - {new Date(createdAt).toLocaleString()}
      </Text>
    </View>
  );
}

export default function FeedbackThread({ feedback = [], replies = [] }) {
  const { theme } = useApp();
  const styles = createFeedbackThreadStyles(theme);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>Feedback Thread</Text>
      {feedback.length === 0 && replies.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No feedback or replies yet.</Text>
        </View>
      ) : null}
      {feedback.map((item) => (
        <ThreadCard
          key={item.id}
          title="Admin Feedback"
          text={item.text}
          author={item.authorName}
          createdAt={item.createdAt}
          styles={styles}
        />
      ))}
      {replies.map((item) => (
        <ThreadCard
          key={item.id}
          title="Resident Reply"
          text={item.text}
          author={item.authorName}
          createdAt={item.createdAt}
          styles={styles}
        />
      ))}
    </View>
  );
}
