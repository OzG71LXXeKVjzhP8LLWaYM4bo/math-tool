import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IB_TOPICS, SUBJECT_NAMES, type Subject } from '@/constants/topics';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TopicSelectorProps {
  onSelect: (subject: Subject, topic: string) => void;
  selectedSubject?: Subject;
  selectedTopic?: string;
}

export function TopicSelector({
  onSelect,
  selectedSubject,
  selectedTopic,
}: TopicSelectorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [expandedSubject, setExpandedSubject] = useState<Subject | null>(selectedSubject || null);

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const bgColor = isDark ? '#1E1E1E' : '#FFFFFF';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;

  const subjects: Subject[] = ['math', 'physics', 'chemistry'];

  return (
    <ScrollView style={styles.container}>
      {subjects.map((subject) => (
        <View key={subject} style={[styles.subjectContainer, { backgroundColor: bgColor }]}>
          <TouchableOpacity
            style={styles.subjectHeader}
            onPress={() =>
              setExpandedSubject(expandedSubject === subject ? null : subject)
            }
          >
            <View style={styles.subjectTitleContainer}>
              <Ionicons
                name={
                  subject === 'math'
                    ? 'calculator'
                    : subject === 'physics'
                    ? 'planet'
                    : 'flask'
                }
                size={24}
                color={activeColor}
              />
              <Text style={[styles.subjectTitle, { color: textColor }]}>
                {SUBJECT_NAMES[subject]}
              </Text>
            </View>
            <Ionicons
              name={expandedSubject === subject ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={subtextColor}
            />
          </TouchableOpacity>

          {expandedSubject === subject && (
            <View style={styles.topicsContainer}>
              {Object.entries(IB_TOPICS[subject]).map(([category, topics]) => (
                <View key={category} style={styles.categoryContainer}>
                  <Text style={[styles.categoryTitle, { color: subtextColor }]}>
                    {category}
                  </Text>
                  <View style={styles.topicsList}>
                    {topics.map((topic) => {
                      const isSelected =
                        selectedSubject === subject && selectedTopic === topic;
                      return (
                        <TouchableOpacity
                          key={topic}
                          style={[
                            styles.topicButton,
                            isSelected && {
                              backgroundColor: `${activeColor}20`,
                              borderColor: activeColor,
                            },
                          ]}
                          onPress={() => onSelect(subject, topic)}
                        >
                          <Text
                            style={[
                              styles.topicText,
                              { color: isSelected ? activeColor : textColor },
                            ]}
                          >
                            {topic}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
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
  subjectContainer: {
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  subjectTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  topicsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  topicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  topicText: {
    fontSize: 14,
  },
});
