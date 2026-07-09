import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const events = [
  { time: '09:30', title: '제주 함덕 해변 산책', type: '여행 일정' },
  { time: '12:00', title: '감귤 마을 점심', type: '여행 일정' },
  { time: '16:00', title: '개인 미팅', type: '일반 일정' },
];

export default function CalendarScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>캘린더</Text>
        <Text style={styles.pageSubtitle}>여행 일정과 개인 일정을 한 번에 관리하세요.</Text>

        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>7월 달력</Text>
            <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>월간</Text></View>
          </View>
          <View style={styles.calendarPreview}>
            <Text style={styles.calendarPreviewText}>달력 미리보기</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>오늘의 일정</Text>
          {events.map((item, index) => (
            <View key={`${item.title}-${index}`} style={styles.eventRow}>
              <View style={styles.eventMark} />
              <View style={styles.eventContent}>
                <Text style={styles.eventText}>{item.title}</Text>
                <Text style={styles.eventMeta}>{item.time} · {item.type}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.todoCard}>
          <View style={styles.todoHeader}>
            <Text style={styles.sectionHeading}>TODOLIST</Text>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>+ 추가하기</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.todoItem}>
            <View style={styles.todoBullet} />
            <Text style={styles.todoText}>여권 및 여행자 보험 확인하기</Text>
          </View>
          <View style={styles.todoItem}>
            <View style={styles.todoBullet} />
            <Text style={styles.todoText}>환전 및 현지 유심 준비</Text>
          </View>
          <View style={styles.todoItem}>
            <View style={styles.todoBullet} />
            <Text style={styles.todoText}>호텔 바우처 출력하기</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5FF',
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
  heroCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  heroBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EEF2FF',
  },
  heroBadgeText: {
    color: '#4338CA',
    fontWeight: '700',
    fontSize: 13,
  },
  calendarPreview: {
    marginTop: 18,
    height: 220,
    borderRadius: 20,
    backgroundColor: '#F4EDFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  calendarPreviewText: {
    color: '#7C3AED',
    fontWeight: '700',
    fontSize: 16,
  },
  sectionCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 18,
  },
  eventMark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 8,
    backgroundColor: '#7C3AED',
  },
  eventContent: {
    flex: 1,
  },
  eventText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  eventMeta: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
  },
  todoCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    borderRadius: 999,
    backgroundColor: '#FECACA',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonText: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  todoItem: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  todoBullet: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#A855F7',
  },
  todoText: {
    color: '#111827',
    fontSize: 15,
    flex: 1,
  },
});
