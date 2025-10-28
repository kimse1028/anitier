'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Header() {
    const { isDark, toggleTheme } = useTheme();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    // 로그인 상태 감지
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/login');
    };

    return (
        <header className={`sticky top-0 z-50 transition-colors duration-300 ${
            isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
        } border-b`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* 로고 */}
                    <button
                        onClick={() => router.push('/')}
                        className={`text-2xl font-bold transition-colors ${
                            isDark ? 'text-white hover:text-purple-400' : 'text-gray-900 hover:text-purple-600'
                        }`}
                    >
                        AniTier
                    </button>

                    {/* 오른쪽 버튼들 */}
                    <div className="flex items-center gap-4">
                        {/* 내 티어리스트 버튼 (로그인 상태일 때만) */}
                        {user && (
                            <button
                                onClick={() => router.push('/my-tier')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    isDark
                                        ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                            >
                                내 티어리스트
                            </button>
                        )}

                        {/* 다크모드 토글 */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-lg transition-colors ${
                                isDark
                                    ? 'hover:bg-gray-800 text-gray-300'
                                    : 'hover:bg-gray-100 text-gray-700'
                            }`}
                            aria-label="테마 전환"
                        >
                            {isDark ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>

                        {/* 로그인/로그아웃 버튼 */}
                        {user ? (
                            <button
                                onClick={handleLogout}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    isDark
                                        ? 'bg-gray-800 text-white hover:bg-gray-700'
                                        : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}
                            >
                                로그아웃
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push('/login')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    isDark
                                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                                        : 'bg-purple-500 text-white hover:bg-purple-600'
                                }`}
                            >
                                로그인
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}