import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CompanionScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>동반자</Text>
        <Text style={styles.pageSubtitle}>초대 코드로 연결하고 공유 범위를 관리하세요.</Text>

        <View style={styles.partnerCard}>
          <Text style={styles.cardHeading}>현재 연결</Text>
          <Text style={styles.partnerName}>유진님</Text>
          <Text style={styles.partnerMeta}>연결 중 · 공유 범위: 전체 공유</Text>
          <TouchableOpacity style={styles.releaseButton}>
            <Text style={styles.releaseButtonText}>연결 해제</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.codeCard}>
          <Text style={styles.cardHeading}>초대 코드</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>TRP-93B2</Text>
          </View>
          <Text style={styles.codeHint}>코드 유효기간 30분 · 5회 실패 시 재생성이 필요합니다.</Text>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>코드 재생성</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.policyCard}>
          <Text style={styles.cardHeading}>공유 정책</Text>
          <Text style={styles.policyText}>기본값은 일정/여행/다이어리 모두 전체 공유입니다. 작성 시 "비밀로 하기"를 선택하면 동반자에게 비공개로 저장됩니다.</Text>
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
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  partnerCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  partnerName: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  partnerMeta: {
    marginTop: 6,
    color: '#6B7280',
    fontSize: 14,
  },
  releaseButton: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: '#F3F4F8',
    paddingVertical: 14,
    alignItems: 'center',
  },
  releaseButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
  codeCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  codeBox: {
    marginTop: 18,
    paddingVertical: 22,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4E7FF',
  },
  codeText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#7C3AED',
    letterSpacing: 4,
  },
  codeHint: {
    marginTop: 12,
    color: '#6B7280',
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  policyCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  policyText: {
    marginTop: 12,
    color: '#4B5563',
    lineHeight: 22,
  },
});
