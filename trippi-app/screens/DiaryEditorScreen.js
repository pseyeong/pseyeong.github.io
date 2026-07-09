import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { diaryEntries } from '../data/trippiData';

export default function DiaryEditorScreen({ route, navigation }) {
  const { date } = route.params || {};
  const entry = diaryEntries.find((item) => item.date === date) || diaryEntries[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>{entry.date}</Text>
        <Text style={styles.pageSubtitle}>오늘의 다이어리를 작성해보세요.</Text>

        <View style={styles.entryCard}>
          <Text style={styles.sectionHeading}>감정 태그</Text>
          <View style={styles.tagsRow}>
            {entry.tags.map((tag) => (
              <View key={tag} style={styles.tagBubble}><Text style={styles.tagText}>#{tag}</Text></View>
            ))}
          </View>

          <Text style={styles.sectionHeading}>기록</Text>
          <Text style={styles.entryText}>{entry.text}</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryButtonText}>저장하고 돌아가기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F2FF',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#111827',
  },
  pageSubtitle: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
  },
  entryCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  tagBubble: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#F4E7FF',
  },
  tagText: {
    color: '#7C3AED',
    fontWeight: '700',
    fontSize: 12,
  },
  entryText: {
    color: '#4B5563',
    lineHeight: 24,
    fontSize: 15,
  },
  primaryButton: {
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
