import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTopicsForCourse, type TopicMap } from '@/constants/topics';
import { useSettingsStore, COURSE_SHORT_NAMES } from '@/stores/settings-store';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TopicSelection {
  topic: string;
  subtopic: string;
}

interface TopicSelectorProps {
  onSelectionChange: (selections: TopicSelection[]) => void;
  selections: TopicSelection[];
}

const TOPIC_ICONS: Record<string, string> = {
  'number-algebra': 'calculator',
  'functions': 'git-branch',
  'geometry-trig': 'shapes',
  'statistics': 'bar-chart',
  'calculus': 'analytics',
};

export function TopicSelector({
  onSelectionChange,
  selections,
}: TopicSelectorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { course } = useSettingsStore();
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const bgColor = isDark ? '#1E1E1E' : '#FFFFFF';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;
  const borderColor = isDark ? '#333' : '#E0E0E0';

  // Get topics for current course
  const topics: TopicMap = course ? getTopicsForCourse(course) : {};
  const topicEntries = Object.entries(topics);

  // Helper to check if a subtopic is selected
  const isSelected = (topic: string, subtopic: string) =>
    selections.some((s) => s.topic === topic && s.subtopic === subtopic);

  // Helper to check if all subtopics of a topic are selected
  const isTopicFullySelected = (topicName: string, subtopics: string[]) =>
    subtopics.every((st) => isSelected(topicName, st));

  // Helper to check if any subtopic of a topic is selected
  const isTopicPartiallySelected = (topicName: string, subtopics: string[]) =>
    subtopics.some((st) => isSelected(topicName, st)) && !isTopicFullySelected(topicName, subtopics);

  // Get all subtopics count
  const totalSubtopics = topicEntries.reduce((sum, [, info]) => sum + info.subtopics.length, 0);
  const isAllSelected = selections.length === totalSubtopics;

  // Toggle a single subtopic
  const toggleSubtopic = (topic: string, subtopic: string) => {
    if (isSelected(topic, subtopic)) {
      onSelectionChange(selections.filter((s) => !(s.topic === topic && s.subtopic === subtopic)));
    } else {
      onSelectionChange([...selections, { topic, subtopic }]);
    }
  };

  // Toggle all subtopics of a topic
  const toggleTopic = (topicName: string, subtopics: string[]) => {
    if (isTopicFullySelected(topicName, subtopics)) {
      // Deselect all subtopics of this topic
      onSelectionChange(selections.filter((s) => s.topic !== topicName));
    } else {
      // Select all subtopics of this topic
      const existingOther = selections.filter((s) => s.topic !== topicName);
      const newSelections = subtopics.map((st) => ({ topic: topicName, subtopic: st }));
      onSelectionChange([...existingOther, ...newSelections]);
    }
  };

  // Toggle all topics and subtopics
  const toggleAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      const allSelections: TopicSelection[] = [];
      topicEntries.forEach(([, info]) => {
        info.subtopics.forEach((st) => {
          allSelections.push({ topic: info.name, subtopic: st });
        });
      });
      onSelectionChange(allSelections);
    }
  };

  if (!course) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: bgColor }]}>
        <Ionicons name="alert-circle" size={48} color={subtextColor} />
        <Text style={[styles.emptyText, { color: subtextColor }]}>
          Please select a course first
        </Text>
      </View>
    );
  }

  // Count selected for a topic
  const getTopicSelectedCount = (topicName: string) =>
    selections.filter((s) => s.topic === topicName).length;

  return (
    <ScrollView style={styles.container}>
      {/* Course badge with Select All */}
      <View style={[styles.courseBadgeContainer, { backgroundColor: bgColor }]}>
        <View style={styles.courseBadgeLeft}>
          <Ionicons name="school" size={20} color={activeColor} />
          <Text style={[styles.courseBadgeText, { color: textColor }]}>
            {COURSE_SHORT_NAMES[course]} Topics
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.selectAllButton,
            { borderColor: isAllSelected ? activeColor : borderColor },
            isAllSelected && { backgroundColor: `${activeColor}15` },
          ]}
          onPress={toggleAll}
        >
          <Ionicons
            name={isAllSelected ? 'checkbox' : 'square-outline'}
            size={18}
            color={isAllSelected ? activeColor : subtextColor}
          />
          <Text style={[styles.selectAllText, { color: isAllSelected ? activeColor : subtextColor }]}>
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selection count */}
      {selections.length > 0 && (
        <View style={[styles.selectionCount, { backgroundColor: `${activeColor}15` }]}>
          <Text style={[styles.selectionCountText, { color: activeColor }]}>
            {selections.length} topic{selections.length !== 1 ? 's' : ''} selected
          </Text>
        </View>
      )}

      {topicEntries.map(([key, info]) => {
        const topicFullySelected = isTopicFullySelected(info.name, info.subtopics);
        const topicPartiallySelected = isTopicPartiallySelected(info.name, info.subtopics);
        const selectedCount = getTopicSelectedCount(info.name);

        return (
          <View key={key} style={[styles.topicContainer, { backgroundColor: bgColor }]}>
            <TouchableOpacity
              style={styles.topicHeader}
              onPress={() => setExpandedTopic(expandedTopic === key ? null : key)}
            >
              <View style={styles.topicTitleContainer}>
                <Ionicons
                  name={(TOPIC_ICONS[key] || 'book') as any}
                  size={24}
                  color={activeColor}
                />
                <View>
                  <Text style={[styles.topicTitle, { color: textColor }]}>
                    {info.name}
                  </Text>
                  {selectedCount > 0 && (
                    <Text style={[styles.topicSelectedCount, { color: activeColor }]}>
                      {selectedCount}/{info.subtopics.length} selected
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.topicMeta}>
                <Ionicons
                  name={expandedTopic === key ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={subtextColor}
                />
              </View>
            </TouchableOpacity>

            {expandedTopic === key && (
              <View style={styles.subtopicsContainer}>
                {/* Select All for this topic */}
                <TouchableOpacity
                  style={[
                    styles.topicSelectAllButton,
                    { borderColor: topicFullySelected ? activeColor : borderColor },
                    topicFullySelected && { backgroundColor: `${activeColor}10` },
                  ]}
                  onPress={() => toggleTopic(info.name, info.subtopics)}
                >
                  <Ionicons
                    name={
                      topicFullySelected
                        ? 'checkbox'
                        : topicPartiallySelected
                        ? 'remove-circle-outline'
                        : 'square-outline'
                    }
                    size={20}
                    color={topicFullySelected || topicPartiallySelected ? activeColor : subtextColor}
                  />
                  <Text
                    style={[
                      styles.topicSelectAllText,
                      { color: topicFullySelected ? activeColor : subtextColor },
                    ]}
                  >
                    {topicFullySelected ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>

                {info.subtopics.map((subtopic) => {
                  const selected = isSelected(info.name, subtopic);
                  return (
                    <TouchableOpacity
                      key={subtopic}
                      style={[
                        styles.subtopicButton,
                        { borderColor: selected ? activeColor : `${borderColor}50` },
                        selected && { backgroundColor: `${activeColor}15` },
                      ]}
                      onPress={() => toggleSubtopic(info.name, subtopic)}
                    >
                      <Ionicons
                        name={selected ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={selected ? activeColor : subtextColor}
                      />
                      <Text
                        style={[
                          styles.subtopicText,
                          { color: selected ? activeColor : textColor },
                        ]}
                      >
                        {subtopic}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
  },
  courseBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  courseBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseBadgeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '500',
  },
  selectionCount: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectionCountText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  topicContainer: {
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  topicTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  topicSelectedCount: {
    fontSize: 12,
    marginTop: 2,
  },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtopicsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  topicSelectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  topicSelectAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subtopicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  subtopicText: {
    fontSize: 15,
    flex: 1,
  },
});
