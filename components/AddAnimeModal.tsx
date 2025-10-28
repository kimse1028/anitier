'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useState, useRef } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface AddAnimeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (title: string, imageUrl: string) => void;
    tierName: string;
}

export default function AddAnimeModal({ isOpen, onClose, onAdd, tierName }: AddAnimeModalProps) {
    const { isDark } = useTheme();
    const [title, setTitle] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 모달이 닫히지 않았으면 아무것도 렌더링 안 함
    if (!isOpen) return null;

    // 이미지 파일 선택 핸들러
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            // 미리보기 생성
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // 애니 추가 핸들러
    const handleSubmit = async () => {
        if (!title.trim()) {
            alert('애니 제목을 입력해주세요!');
            return;
        }
        if (!imageFile) {
            alert('이미지를 선택해주세요!');
            return;
        }

        setUploading(true);

        try {
            // Firebase Storage에 이미지 업로드
            const storageRef = ref(storage, `anime-images/${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            const imageUrl = await getDownloadURL(storageRef);

            // 부모 컴포넌트로 데이터 전달
            onAdd(title, imageUrl);

            // 초기화
            setTitle('');
            setImageFile(null);
            setImagePreview('');
            onClose();
        } catch (error) {
            console.error('이미지 업로드 실패:', error);
            alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`w-full max-w-lg rounded-2xl p-6 ${
                isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
            }`}>
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                        {tierName} 티어에 애니 추가
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${
                            isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                        }`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 제목 입력 */}
                <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                        애니 제목
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="예: 스즈메의 문단속"
                        className={`w-full px-4 py-3 rounded-lg transition-colors ${
                            isDark
                                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                </div>

                {/* 이미지 업로드 */}
                <div className="mb-6">
                    <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                        애니 이미지
                    </label>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                    />

                    {!imagePreview ? (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full h-48 rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 ${
                                isDark
                                    ? 'border-gray-700 hover:border-gray-600 text-gray-400 hover:bg-gray-800'
                                    : 'border-gray-300 hover:border-gray-400 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>이미지 선택</span>
                        </button>
                    ) : (
                        <div className="relative">
                            <img
                                src={imagePreview}
                                alt="미리보기"
                                className="w-full h-64 object-cover rounded-lg"
                            />
                            <button
                                onClick={() => {
                                    setImageFile(null);
                                    setImagePreview('');
                                }}
                                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* 버튼들 */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                            isDark
                                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                        }`}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={uploading}
                        className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? '업로드 중...' : '추가'}
                    </button>
                </div>
            </div>
        </div>
    );
}