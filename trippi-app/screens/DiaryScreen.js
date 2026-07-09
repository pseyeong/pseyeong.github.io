import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DiaryScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>다이어리</Text>
        <Text style={styles.pageSubtitle}>여행의 순간을 더 아름답게 기록해보세요.</Text>

        <View style={styles.diaryHeader}>
          <View>
            <Text style={styles.diaryTitle}>오늘의 여행 기록</Text>
            <Text style={styles.diaryDate}>2026.07.11 (목)</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('DiaryEditor', { date: '2026-07-11' })}>
            <Text style={styles.editButtonText}>수정</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.entryCard}>
          <View style={styles.tagRow}>
            <View style={styles.tagBubble}><Text style={styles.tagText}>#감성</Text></View>
            <View style={styles.tagBubble}><Text style={styles.tagText}>#제주</Text></View>
          </View>
          <Text style={styles.entryText}>감귤 카페에서 따뜻한 오후를 보냈어요. 바다가 보이는 창가에서 여유롭게 여행을 즐겼습니다.</Text>
          <View style={styles.mediaRow}>
            <View style={styles.mediaCard}><Text style={styles.mediaLabel}>사진</Text></View>
            <View style={styles.mediaCard}><Text style={styles.mediaLabel}>스티커</Text></View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>자동 태그</Text>
          <Text style={styles.infoText}>여행 일정에 따라 다이어리 태그를 자동 생성해 기록 관리를 도와드립니다.</Text>
        </View>
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
  diaryHeader: {
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  diaryDate: {
    marginTop: 6,
    color: '#6B7280',
    fontSize: 14,
  },
  editButton: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: '#E9D5FF',
  },
  editButtonText: {
    color: '#7C3AED',
    fontWeight: '700',
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
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  tagBubble: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F2E7FF',
  },
  tagText: {
    color: '#7C3AED',
    fontWeight: '700',
    fontSize: 12,
  },
  entryText: {
    color: '#4B5563',
    lineHeight: 24,
    fontSize: 14,
  },
  mediaRow: {
    marginTop: 22,
    flexDirection: 'row',
    gap: 12,
  },
  mediaCard: {
    flex: 1,
    height: 120,
    borderRadius: 20,
    backgroundColor: '#F4E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaLabel: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  infoCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  infoText: {
    marginTop: 10,
    color: '#4B5563',
    lineHeight: 22,
  },
});
