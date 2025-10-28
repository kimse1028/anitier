'use client';

import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function LoginPage() {
    const router = useRouter();
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);

            router.push('/');
        } catch (err: any) {
            console.error('로그인 실패:', err);
            setError('로그인에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 px-4 ${
            isDark ? 'bg-black' : 'bg-white'
        }`}>
            {/* 로그인 카드 */}
            <div className={`p-6 sm:p-10 rounded-2xl max-w-md w-full transition-all duration-300 ${
                isDark
                    ? 'bg-gray-900 shadow-2xl shadow-gray-900/50 border border-gray-800'
                    : 'bg-white shadow-2xl shadow-gray-200/50 border border-gray-200'
            }`}>
                {/* 로고/타이틀 */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full mb-3 sm:mb-4 ${
                        isDark ? 'bg-purple-600' : 'bg-purple-500'
                    }`}>
                        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                    </div>
                    <h1 className={`text-3xl sm:text-4xl font-bold mb-2 ${
                        isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                        AniTier
                    </h1>
                    <p className={`text-base sm:text-lg ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        나만의 애니 티어리스트
                    </p>
                </div>

                {/* 구글 로그인 버튼 */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base ${
                        isDark
                            ? 'bg-white text-gray-900 hover:bg-gray-100 shadow-lg shadow-white/20'
                            : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95`}
                >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    {loading ? '로그인 중...' : 'Google로 시작하기'}
                </button>

                {/* 에러 메시지 */}
                {error && (
                    <div className={`mt-4 p-3 rounded-lg ${
                        isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'
                    }`}>
                        <p className="text-xs sm:text-sm text-center">{error}</p>
                    </div>
                )}

                {/* 하단 설명 */}
                <p className={`mt-4 sm:mt-6 text-center text-xs sm:text-sm ${
                    isDark ? 'text-gray-500' : 'text-gray-500'
                }`}>
                    로그인하고 나만의 애니 랭킹을 공유하세요
                </p>
            </div>
        </div>
    );
}