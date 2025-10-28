'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

// 티어 타입 정의
type TierType = '국가권력급' | 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

// 애니 아이템 타입
interface AnimeItem {
    id: string;
    title: string;
    imageUrl: string;
}

// 티어 데이터 타입
interface TierData {
    tier: TierType;
    color: string;
    desc: string;
    animes: AnimeItem[];
}

// 사용자 정보 타입
interface UserInfo {
    displayName: string;
    photoURL: string;
    email: string;
}

export default function ProfilePage() {
    const { isDark } = useTheme();
    const params = useParams();
    const userId = params.userId as string;

    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);

    // 티어 데이터
    const [tiers, setTiers] = useState<TierData[]>([
        { tier: '국가권력급', color: 'from-yellow-400 to-orange-500', desc: '인생 애니', animes: [] },
        { tier: 'S', color: 'from-red-500 to-pink-500', desc: 'N회차 가능한 명작', animes: [] },
        { tier: 'A', color: 'from-orange-500 to-red-500', desc: '마음에 여운을 줌', animes: [] },
        { tier: 'B', color: 'from-yellow-500 to-orange-500', desc: '볼만함', animes: [] },
        { tier: 'C', color: 'from-green-500 to-yellow-500', desc: '킬링타임', animes: [] },
        { tier: 'D', color: 'from-blue-500 to-green-500', desc: '별로임', animes: [] },
        { tier: 'F', color: 'from-gray-500 to-blue-500', desc: '쓰레기', animes: [] },
    ]);

    // 사용자 정보와 티어 데이터 불러오기
    useEffect(() => {
        loadProfileData();
    }, [userId]);

    const loadProfileData = async () => {
        setLoading(true);
        try {
            // 사용자 정보 불러오기
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                alert('사용자를 찾을 수 없습니다.');
                return;
            }

            setUserInfo(userDoc.data() as UserInfo);

            // 각 티어별 데이터 불러오기
            const loadedTiers = await Promise.all(
                tiers.map(async (tierData) => {
                    const tierDocRef = doc(db, 'users', userId, 'tiers', tierData.tier);
                    const tierDoc = await getDoc(tierDocRef);

                    if (tierDoc.exists()) {
                        return { ...tierData, animes: tierDoc.data().animes || [] };
                    }
                    return tierData;
                })
            );

            setTiers(loadedTiers);
        } catch (error) {
            console.error('프로필 데이터 불러오기 실패:', error);
            alert('데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 로딩 중이면 로딩 화면 표시
    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${
                isDark ? 'bg-black' : 'bg-white'
            }`}>
                <div className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    로딩 중...
                </div>
            </div>
        );
    }

    if (!userInfo) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${
                isDark ? 'bg-black' : 'bg-white'
            }`}>
                <div className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    사용자를 찾을 수 없습니다.
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            isDark ? 'bg-black' : 'bg-white'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* 프로필 헤더 */}
                <div className={`rounded-2xl p-8 mb-8 ${
                    isDark
                        ? 'bg-gray-900 border border-gray-800'
                        : 'bg-white border border-gray-200'
                }`}>
                    <div className="flex items-center gap-6">
                        <img
                            src={userInfo.photoURL || '/default-avatar.png'}
                            alt={userInfo.displayName}
                            className="w-24 h-24 rounded-full object-cover"
                        />
                        <div>
                            <h1 className={`text-4xl font-bold mb-2 ${
                                isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                                {userInfo.displayName}의 애니 티어리스트
                            </h1>
                            <p className={`text-lg ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                {userInfo.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 티어 리스트 */}
                <div className="space-y-6">
                    {tiers.map((tierData) => (
                        <div
                            key={tierData.tier}
                            className={`rounded-xl overflow-hidden ${
                                isDark
                                    ? 'bg-gray-900 border border-gray-800'
                                    : 'bg-white border border-gray-200'
                            }`}
                        >
                            {/* 티어 헤더 */}
                            <div className={`flex items-center justify-between p-4 bg-gradient-to-r ${tierData.color}`}>
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl font-bold text-white">
                                        {tierData.tier}
                                    </div>
                                    <div className="text-sm text-white opacity-90">
                                        {tierData.desc}
                                    </div>
                                </div>
                                <div className="text-white text-sm font-medium">
                                    {tierData.animes.length}개
                                </div>
                            </div>

                            {/* 애니 목록 */}
                            <div className="p-4">
                                {tierData.animes.length === 0 ? (
                                    <div className={`text-center py-8 ${
                                        isDark ? 'text-gray-600' : 'text-gray-400'
                                    }`}>
                                        아직 추가된 애니가 없습니다
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {tierData.animes.map((anime) => (
                                            <div
                                                key={anime.id}
                                                className={`rounded-lg overflow-hidden ${
                                                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                                                }`}
                                            >
                                                <div className="aspect-[3/4] relative">
                                                    <img
                                                        src={anime.imageUrl}
                                                        alt={anime.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="p-2">
                                                    <p className={`text-sm font-medium truncate ${
                                                        isDark ? 'text-white' : 'text-gray-900'
                                                    }`}>
                                                        {anime.title}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 댓글 섹션 (다음 단계에서 추가) */}
                <div className={`mt-12 rounded-2xl p-8 ${
                    isDark
                        ? 'bg-gray-900 border border-gray-800'
                        : 'bg-white border border-gray-200'
                }`}>
                    <h2 className={`text-2xl font-bold mb-4 ${
                        isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                        방명록
                    </h2>
                    <p className={`text-center py-8 ${
                        isDark ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                        댓글 기능은 다음 단계에서 추가됩니다
                    </p>
                </div>
            </div>
        </div>
    );
}