import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useSettingsStore,
  COURSE_NAMES,
  Course,
  ThemePreference,
} from '@/stores/settings-store';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { course, themePreference, setCourse, setThemePreference } = useSettingsStore();
  const [showCourseModal, setShowCourseModal] = useState(false);

  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subtextColor = isDark ? '#888' : '#666';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const activeColor = isDark ? Colors.dark.tint : Colors.light.tint;
  const borderColor = isDark ? '#333' : '#E0E0E0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: subtextColor }]}>
            Customize your experience
          </Text>
        </View>

        {/* Appearance Section */}
        <Text style={[styles.sectionLabel, { color: subtextColor }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="color-palette-outline" size={22} color={activeColor} />
              <Text style={[styles.settingLabel, { color: textColor }]}>Theme</Text>
            </View>
          </View>

          {/* Theme Toggle */}
          <View style={[styles.themeToggle, { borderColor }]}>
            {THEME_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.themeOption,
                  themePreference === option.value && {
                    backgroundColor: activeColor,
                  },
                ]}
                onPress={() => setThemePreference(option.value)}
              >
                <Ionicons
                  name={option.icon}
                  size={18}
                  color={themePreference === option.value ? '#FFFFFF' : subtextColor}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color: themePreference === option.value ? '#FFFFFF' : subtextColor,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Course Section */}
        <Text style={[styles.sectionLabel, { color: subtextColor }]}>COURSE</Text>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: cardBg }]}
          onPress={() => setShowCourseModal(true)}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="school-outline" size={22} color={activeColor} />
              <View>
                <Text style={[styles.settingLabel, { color: textColor }]}>IB Math Course</Text>
                <Text style={[styles.settingValue, { color: subtextColor }]}>
                  {course ? COURSE_NAMES[course] : 'Not selected'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={subtextColor} />
          </View>
        </TouchableOpacity>

        {/* About Section */}
        <Text style={[styles.sectionLabel, { color: subtextColor }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle-outline" size={22} color={activeColor} />
              <Text style={[styles.settingLabel, { color: textColor }]}>Version</Text>
            </View>
            <Text style={[styles.settingValue, { color: subtextColor }]}>1.0.0</Text>
          </View>
        </View>

        {/* Course Selection Modal */}
        <Modal
          visible={showCourseModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCourseModal(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: isDark ? Colors.dark.background : '#F5F5F5' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Select Course</Text>
              <TouchableOpacity onPress={() => setShowCourseModal(false)}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.courseOptions}>
              {(['aa', 'ai'] as Course[]).map((courseOption) => (
                <TouchableOpacity
                  key={courseOption}
                  style={[
                    styles.courseOption,
                    { backgroundColor: cardBg, borderColor },
                    course === courseOption && { borderColor: activeColor, borderWidth: 2 },
                  ]}
                  onPress={() => {
                    setCourse(courseOption);
                    setShowCourseModal(false);
                  }}
                >
                  <View style={styles.courseHeader}>
                    <Text style={[styles.courseName, { color: textColor }]}>
                      {COURSE_NAMES[courseOption]}
                    </Text>
                    {course === courseOption && (
                      <Ionicons name="checkmark-circle" size={24} color={activeColor} />
                    )}
                  </View>
                  <Text style={[styles.courseDescription, { color: subtextColor }]}>
                    {courseOption === 'aa'
                      ? 'Focus on algebraic methods, proofs, and abstract reasoning'
                      : 'Focus on real-world applications, modeling, and technology'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    marginTop: 2,
  },
  themeToggle: {
    flexDirection: 'row',
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  courseOptions: {
    gap: 16,
  },
  courseOption: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
  },
  courseDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
