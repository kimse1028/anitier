'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface UserProfile {
    uid: string;
    displayName: string;
    photoURL: string;
    email: string;
}

export default function HomePage() {
    const { isDark } = useTheme();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // 모든 사용자 불러오기
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const usersCollectionRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersCollectionRef);

            const usersList: UserProfile[] = [];
            usersSnapshot.forEach((doc) => {
                usersList.push({
                    uid: doc.id,
                    ...doc.data() as Omit<UserProfile, 'uid'>
                });
            });

            setUsers(usersList);
        } catch (error) {
            console.error('사용자 목록 불러오기 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            isDark ? 'bg-black' : 'bg-white'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* 히어로 섹션 */}
                <div className="text-center mb-16">
                    <h1 className={`text-5xl font-bold mb-4 ${
                        isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                        당신만의 애니 티어리스트를
                    </h1>
                    <p className={`text-xl mb-8 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        국가권력급부터 F랭크까지, 나만의 애니 랭킹을 만들고 공유하세요
                    </p>

                    {!user && (
                        <button
                            onClick={() => router.push('/login')}
                            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
                        >
                            시작하기
                        </button>
                    )}

                    {user && (
                        <button
                            onClick={() => router.push('/my-tier')}
                            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
                        >
                            내 티어리스트 만들기
                        </button>
                    )}
                </div>

                {/* 티어 등급 설명 */}
                <div className={`rounded-2xl p-8 mb-16 ${
                    isDark
                        ? 'bg-gray-900 border border-gray-800'
                        : 'bg-gray-50 border border-gray-200'
                }`}>
                    <h2 className={`text-2xl font-bold mb-6 text-center ${
                        isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                        티어 등급 안내
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
                        {[
                            { name: '국가권력급', color: 'from-yellow-400 to-orange-500', desc: '인생 애니' },
                            { name: 'S', color: 'from-red-500 to-pink-500', desc: 'N회차 가능한 명작' },
                            { name: 'A', color: 'from-orange-500 to-red-500', desc: '마음에 여운을 줌' },
                            { name: 'B', color: 'from-yellow-500 to-orange-500', desc: '볼만함' },
                            { name: 'C', color: 'from-green-500 to-yellow-500', desc: '킬링타임' },
                            { name: 'D', color: 'from-blue-500 to-green-500', desc: '별로임' },
                            { name: 'F', color: 'from-gray-500 to-blue-500', desc: '쓰레기' },
                        ].map((tier) => (
                            <div
                                key={tier.name}
                                className={`p-4 rounded-lg bg-gradient-to-br ${tier.color} text-white text-center`}
                            >
                                <div className="text-2xl font-bold mb-1">{tier.name}</div>
                                <div className="text-sm opacity-90">{tier.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 사용자 목록 */}
                <div>
                    <h2 className={`text-3xl font-bold mb-8 ${
                        isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                        모든 사용자의 티어리스트
                    </h2>

                    {loading ? (
                        <div className={`text-center py-16 rounded-2xl ${
                            isDark
                                ? 'bg-gray-900 border border-gray-800'
                                : 'bg-gray-50 border border-gray-200'
                        }`}>
                            <p className={`text-lg ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                로딩 중...
                            </p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className={`text-center py-16 rounded-2xl ${
                            isDark
                                ? 'bg-gray-900 border border-gray-800'
                                : 'bg-gray-50 border border-gray-200'
                        }`}>
                            <p className={`text-lg ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                아직 등록된 티어리스트가 없습니다
                            </p>
                            <p className={`text-sm mt-2 ${
                                isDark ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                                첫 번째로 티어리스트를 만들어보세요!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {users.map((userProfile) => (
                                <div
                                    key={userProfile.uid}
                                    onClick={() => router.push(`/profile/${userProfile.uid}`)}
                                    className={`p-6 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
                                        isDark
                                            ? 'bg-gray-900 border border-gray-800 hover:border-purple-500'
                                            : 'bg-white border border-gray-200 hover:border-purple-500 shadow-lg'
                                    }`}
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <img
                                            src={userProfile.photoURL || '/default-avatar.png'}
                                            alt={userProfile.displayName}
                                            className="w-16 h-16 rounded-full object-cover"
                                        />
                                        <div>
                                            <h3 className={`text-xl font-bold ${
                                                isDark ? 'text-white' : 'text-gray-900'
                                            }`}>
                                                {userProfile.displayName}
                                            </h3>
                                            <p className={`text-sm ${
                                                isDark ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}