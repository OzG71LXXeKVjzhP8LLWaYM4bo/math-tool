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

interface TopicSelectorProps {
  onSelect: (topic: string, subtopic: string) => void;
  selectedTopic?: string;
  selectedSubtopic?: string;
}

const TOPIC_ICONS: Record<string, string> = {
  'number-algebra': 'calculator',
  'functions': 'git-branch',
  'geometry-trig': 'shapes',
  'statistics': 'bar-chart',
  'calculus': 'analytics',
};

export function TopicSelector({
  onSelect,
  selectedTopic,
  selectedSubtopic,
}: TopicSelectorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { course } = useSettingsStore();
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const bgColor = isDark ? '#1E1E1E' : '#FFFFFF';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;

  // Get topics for current course
  const topics: TopicMap = course ? getTopicsForCourse(course) : {};
  const topicEntries = Object.entries(topics);

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

  return (
    <ScrollView style={styles.container}>
      {/* Course badge */}
      <View style={[styles.courseBadgeContainer, { backgroundColor: bgColor }]}>
        <Ionicons name="school" size={20} color={activeColor} />
        <Text style={[styles.courseBadgeText, { color: textColor }]}>
          {COURSE_SHORT_NAMES[course]} Topics
        </Text>
      </View>

      {topicEntries.map(([key, info]) => (
        <View key={key} style={[styles.topicContainer, { backgroundColor: bgColor }]}>
          <TouchableOpacity
            style={styles.topicHeader}
            onPress={() =>
              setExpandedTopic(expandedTopic === key ? null : key)
            }
          >
            <View style={styles.topicTitleContainer}>
              <Ionicons
                name={(TOPIC_ICONS[key] || 'book') as any}
                size={24}
                color={activeColor}
              />
              <Text style={[styles.topicTitle, { color: textColor }]}>
                {info.name}
              </Text>
            </View>
            <View style={styles.topicMeta}>
              <Text style={[styles.subtopicCount, { color: subtextColor }]}>
                {info.subtopics.length}
              </Text>
              <Ionicons
                name={expandedTopic === key ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={subtextColor}
              />
            </View>
          </TouchableOpacity>

          {expandedTopic === key && (
            <View style={styles.subtopicsContainer}>
              {info.subtopics.map((subtopic) => {
                const isSelected =
                  selectedTopic === info.name && selectedSubtopic === subtopic;
                return (
                  <TouchableOpacity
                    key={subtopic}
                    style={[
                      styles.subtopicButton,
                      isSelected && {
                        backgroundColor: `${activeColor}20`,
                        borderColor: activeColor,
                      },
                    ]}
                    onPress={() => onSelect(info.name, subtopic)}
                  >
                    <Text
                      style={[
                        styles.subtopicText,
                        { color: isSelected ? activeColor : textColor },
                      ]}
                    >
                      {subtopic}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color={activeColor} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      ))}
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
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  courseBadgeText: {
    fontSize: 16,
    fontWeight: '600',
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
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtopicCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  subtopicsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  subtopicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E030',
    marginBottom: 8,
  },
  subtopicText: {
    fontSize: 15,
  },
});
