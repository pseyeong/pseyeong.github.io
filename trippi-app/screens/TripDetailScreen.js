import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { trips } from '../data/trippiData';

export default function TripDetailScreen({ route }) {
  const { tripId } = route.params || {};
  const trip = trips.find((item) => item.id === tripId) || trips[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>{trip.title}</Text>
        <Text style={styles.pageSubtitle}>{trip.dates} · {trip.daysCount}박 {trip.daysCount - 1}일</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryHeading}>여행 요약</Text>
          <Text style={styles.summaryText}>{trip.summary}</Text>
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.summaryHeading}>Day별 일정</Text>
          {trip.days?.length ? (
            trip.days.map((day, index) => (
              <View key={day.id || index} style={styles.timelineRow}>
                <View style={styles.timelineIndex}>
                  <Text style={styles.timelineIndexText}>{day.label}</Text>
                </View>
                <View style={styles.timelineInfo}>
                  <Text style={styles.timelinePlace}>{day.place}</Text>
                  <Text style={styles.timelineTime}>{day.time}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.summaryText}>이 여행의 Day별 루트 정보가 준비되고 있습니다.</Text>
          )}
        </View>

        <View style={styles.mapCard}>
          <Text style={styles.summaryHeading}>루트 시각화</Text>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>카카오맵 통합 예정</Text>
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
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
  },
  pageSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
  },
  summaryCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  summaryHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  summaryText: {
    marginTop: 12,
    color: '#4B5563',
    lineHeight: 22,
    fontSize: 14,
  },
  timelineCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 18,
  },
  timelineIndex: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E9D5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIndexText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7C3AED',
  },
  timelineInfo: {
    flex: 1,
  },
  timelinePlace: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  timelineTime: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 13,
  },
  mapCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  mapPlaceholder: {
    marginTop: 18,
    height: 220,
    borderRadius: 20,
    backgroundColor: '#F4EDFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  mapPlaceholderText: {
    color: '#7C3AED',
    fontSize: 15,
  },
});
