import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const currentTrip = {
  title: '제주 3박 4일 로드트립',
  period: '2026.07.10 - 2026.07.13',
  badge: 'Day 2',
  summary: '한라산 등반, 제주 감귤 카페, 협재 해변 산책',
};

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroPanel}>
          <Text style={styles.heroTitle}>My Travel Plan</Text>
          <Text style={styles.heroSubtitle}>오늘도 설레는 여행의 시작 ✈️</Text>
        </View>

        <View style={styles.tripCard}>
          <View style={styles.tripBadgeRow}>
            <View style={styles.tripBadge}><Text style={styles.tripBadgeText}>{currentTrip.badge}</Text></View>
            <Text style={styles.tripPeriod}>{currentTrip.period}</Text>
          </View>
          <Text style={styles.tripCardTitle}>{currentTrip.title}</Text>
          <Text style={styles.tripCardSummary}>{currentTrip.summary}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Trip', { screen: 'TripDetail', params: { tripId: 'trip-01' } })}
          >
            <Text style={styles.primaryButtonText}>여행 상세 보기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickRow}>
          <View style={styles.quickCard}>
            <Text style={styles.quickLabel}>오늘 일정</Text>
            <Text style={styles.quickNumber}>3</Text>
          </View>
          <View style={styles.quickCard}>
            <Text style={styles.quickLabel}>다이어리 미작성</Text>
            <Text style={styles.quickNumber}>1</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>오늘의 일정</Text>
          <View style={styles.eventRow}>
            <View style={styles.eventDot} />
            <View style={styles.eventContent}>
              <Text style={styles.eventText}>07.10 제주 감귤 카페 방문</Text>
              <Text style={styles.eventSubText}>10:00 · 여행 일정</Text>
            </View>
          </View>
          <View style={styles.eventRow}> 
            <View style={[styles.eventDot, styles.eventDotSoft]} />
            <View style={styles.eventContent}>
              <Text style={styles.eventText}>07.11 개인 미팅</Text>
              <Text style={styles.eventSubText}>14:00 · 일반 일정</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>동반자와 함께</Text>
          <Text style={styles.companionText}>유진님과 함께한 지 42일</Text>
          <View style={styles.badgeRow}>
            <View style={styles.tag}><Text style={styles.tagText}>공유 일정 100%</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>비밀 기록 가능</Text></View>
          </View>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>연결 관리</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4FF',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  heroPanel: {
    borderRadius: 20,
    padding: 24,
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
  },
  tripCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
  },
  tripBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },
  tripBadgeText: {
    color: '#4338CA',
    fontWeight: '700',
    fontSize: 12,
  },
  tripPeriod: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
  tripCardTitle: {
    marginTop: 18,
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
  },
  tripCardSummary: {
    marginTop: 10,
    color: '#4B5563',
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
  },
  quickLabel: {
    color: '#6B7280',
    fontSize: 13,
  },
  quickNumber: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
  },
  sectionCard: {
    marginTop: 20,
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 3,
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
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    backgroundColor: '#7C3AED',
  },
  eventDotSoft: {
    backgroundColor: '#C4B5FD',
  },
  eventContent: {
    flex: 1,
  },
  eventText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  eventSubText: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 13,
  },
  companionText: {
    marginTop: 12,
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 22,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },
  tagText: {
    color: '#4338CA',
    fontWeight: '700',
    fontSize: 12,
  },
  secondaryButton: {
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F8F2FF',
  },
  secondaryButtonText: {
    color: '#4338CA',
    fontWeight: '700',
    fontSize: 15,
  },
});
