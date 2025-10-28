'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import AddAnimeModal from '@/components/AddAnimeModal';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    DragOverEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

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

// 드래그 가능한 애니 카드 컴포넌트
function SortableAnimeCard({ anime, isDark, onDelete }: { anime: AnimeItem; isDark: boolean; onDelete: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: anime.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`rounded-lg overflow-hidden group relative cursor-grab active:cursor-grabbing ${
                isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}
        >
            <div className="aspect-[3/4] relative">
                <img
                    src={anime.imageUrl}
                    alt={anime.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                />
                {/* 삭제 버튼 */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="p-2">
                <p className={`text-sm font-medium truncate ${
                    isDark ? 'text-white' : 'text-gray-900'
                }`}>
                    {anime.title}
                </p>
            </div>
        </div>
    );
}

// Droppable 티어 컨테이너
function DroppableTierContainer({
                                    tier,
                                    children,
                                    isDark,
                                    isOver
                                }: {
    tier: TierType;
    children: React.ReactNode;
    isDark: boolean;
    isOver: boolean;
}) {
    const { setNodeRef } = useDroppable({
        id: tier,
    });

    return (
        <div
            ref={setNodeRef}
            className={`p-4 transition-colors ${
                isOver ? (isDark ? 'bg-purple-900/20' : 'bg-purple-100/50') : ''
            }`}
        >
            {children}
        </div>
    );
}

export default function MyTierPage() {
    const { isDark } = useTheme();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTier, setSelectedTier] = useState<TierType | null>(null);

    // 드래그 상태
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);

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

    // 드래그 앤 드롭 센서 설정
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 로그인 확인
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (!currentUser) {
                router.push('/login');
            } else {
                setUser(currentUser);
                loadTierData(currentUser.uid);
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Firestore에서 티어 데이터 불러오기
    const loadTierData = async (userId: string) => {
        setLoading(true);
        try {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    displayName: auth.currentUser?.displayName || '익명',
                    email: auth.currentUser?.email || '',
                    photoURL: auth.currentUser?.photoURL || '',
                    createdAt: new Date(),
                });
            }

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
            console.error('데이터 불러오기 실패:', error);
            alert('데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // Firestore에 저장
    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            await Promise.all(
                tiers.map(async (tierData) => {
                    const tierDocRef = doc(db, 'users', user.uid, 'tiers', tierData.tier);
                    await setDoc(tierDocRef, {
                        animes: tierData.animes,
                        updatedAt: new Date(),
                    });
                })
            );

            alert('저장되었습니다!');
        } catch (error) {
            console.error('저장 실패:', error);
            alert('저장에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setSaving(false);
        }
    };

    // "애니 추가" 버튼 클릭
    const handleOpenModal = (tier: TierType) => {
        const tierData = tiers.find(t => t.tier === tier);
        if (tier === '국가권력급' && tierData && tierData.animes.length >= 1) {
            alert('국가권력급은 1개만 추가할 수 있습니다!');
            return;
        }

        setSelectedTier(tier);
        setIsModalOpen(true);
    };

    // 모달 닫기
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTier(null);
    };

    // 애니 추가
    const handleAddAnime = (title: string, imageUrl: string) => {
        if (!selectedTier) return;

        const tierData = tiers.find(t => t.tier === selectedTier);
        if (selectedTier === '국가권력급' && tierData && tierData.animes.length >= 1) {
            alert('국가권력급은 1개만 추가할 수 있습니다!');
            return;
        }

        const newAnime: AnimeItem = {
            id: Date.now().toString(),
            title,
            imageUrl,
        };

        setTiers((prevTiers) =>
            prevTiers.map((tierData) =>
                tierData.tier === selectedTier
                    ? { ...tierData, animes: [...tierData.animes, newAnime] }
                    : tierData
            )
        );
    };

    // 애니 삭제
    const handleDeleteAnime = (tier: TierType, animeId: string) => {
        if (confirm('이 애니를 삭제하시겠습니까?')) {
            setTiers((prevTiers) =>
                prevTiers.map((tierData) =>
                    tierData.tier === tier
                        ? { ...tierData, animes: tierData.animes.filter((anime) => anime.id !== animeId) }
                        : tierData
                )
            );
        }
    };

    // 드래그한 애니 찾기
    const findAnimeById = (id: string) => {
        for (const tier of tiers) {
            const anime = tier.animes.find(a => a.id === id);
            if (anime) return anime;
        }
        return null;
    };

    // 드래그 시작
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    // 드래그 중
    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        setOverId(over ? (over.id as string) : null);
    };

    // 드래그 종료
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveId(null);
        setOverId(null);

        if (!over) return;

        const activeAnimeId = active.id as string;
        const overId = over.id as string;

        // 어느 티어에서 왔는지, 어느 티어로 가는지 찾기
        let sourceTier: TierType | null = null;
        let targetTier: TierType | null = null;

        // 소스 티어 찾기
        for (const tier of tiers) {
            if (tier.animes.find(a => a.id === activeAnimeId)) {
                sourceTier = tier.tier;
                break;
            }
        }

        // 타겟 티어 찾기
        // overId가 티어 이름이면 그 티어로, 아니면 그 애니가 속한 티어로
        const tierNames: TierType[] = ['국가권력급', 'S', 'A', 'B', 'C', 'D', 'F'];
        if (tierNames.includes(overId as TierType)) {
            targetTier = overId as TierType;
        } else {
            for (const tier of tiers) {
                if (tier.animes.find(a => a.id === overId)) {
                    targetTier = tier.tier;
                    break;
                }
            }
        }

        if (!sourceTier || !targetTier) return;

        // 국가권력급으로 이동하려는 경우 체크
        if (targetTier === '국가권력급' && sourceTier !== '국가권력급') {
            const targetTierData = tiers.find(t => t.tier === '국가권력급');
            if (targetTierData && targetTierData.animes.length >= 1) {
                alert('국가권력급은 1개만 가질 수 있습니다!');
                return;
            }
        }

        // 같은 티어 내에서 순서 변경
        if (sourceTier === targetTier) {
            setTiers((prevTiers) =>
                prevTiers.map((tierData) => {
                    if (tierData.tier !== sourceTier) return tierData;

                    const oldIndex = tierData.animes.findIndex(a => a.id === activeAnimeId);
                    const newIndex = tierData.animes.findIndex(a => a.id === overId);

                    if (oldIndex === -1) return tierData;

                    // overId가 티어 이름이면 맨 끝으로
                    if (newIndex === -1) {
                        return tierData;
                    }

                    return {
                        ...tierData,
                        animes: arrayMove(tierData.animes, oldIndex, newIndex),
                    };
                })
            );
        } else {
            // 다른 티어로 이동
            setTiers((prevTiers) => {
                const sourceAnime = findAnimeById(activeAnimeId);
                if (!sourceAnime) return prevTiers;

                return prevTiers.map((tierData) => {
                    // 소스 티어에서 제거
                    if (tierData.tier === sourceTier) {
                        return {
                            ...tierData,
                            animes: tierData.animes.filter(a => a.id !== activeAnimeId),
                        };
                    }

                    // 타겟 티어에 추가
                    if (tierData.tier === targetTier) {
                        // overId가 티어 이름이면 맨 끝에 추가
                        if (tierNames.includes(overId as TierType)) {
                            return {
                                ...tierData,
                                animes: [...tierData.animes, sourceAnime],
                            };
                        }

                        // 특정 애니 위치에 삽입
                        const targetIndex = tierData.animes.findIndex(a => a.id === overId);
                        if (targetIndex === -1) {
                            return {
                                ...tierData,
                                animes: [...tierData.animes, sourceAnime],
                            };
                        }

                        const newAnimes = [...tierData.animes];
                        newAnimes.splice(targetIndex, 0, sourceAnime);
                        return {
                            ...tierData,
                            animes: newAnimes,
                        };
                    }

                    return tierData;
                });
            });
        }
    };

    // 모든 애니 ID 수집
    const allAnimeIds = tiers.flatMap(tier => tier.animes.map(anime => anime.id));

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

    const activeAnime = activeId ? findAnimeById(activeId) : null;

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            isDark ? 'bg-black' : 'bg-white'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* 헤더 */}
                <div className="mb-8">
                    <h1 className={`text-4xl font-bold mb-2 ${
                        isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                        내 애니 티어리스트
                    </h1>
                    <p className={`text-lg ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        각 티어에 애니를 추가하고 드래그로 순서를 변경하거나 다른 티어로 이동하세요
                    </p>
                </div>

                {/* 티어 리스트 */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
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
                                            {tierData.tier === '국가권력급' && ' (최대 1개)'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleOpenModal(tierData.tier)}
                                        disabled={tierData.tier === '국가권력급' && tierData.animes.length >= 1}
                                        className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        + 애니 추가
                                    </button>
                                </div>

                                {/* 애니 목록 */}
                                <DroppableTierContainer
                                    tier={tierData.tier}
                                    isDark={isDark}
                                    isOver={overId === tierData.tier}
                                >
                                    {tierData.animes.length === 0 ? (
                                        <div className={`text-center py-8 ${
                                            isDark ? 'text-gray-600' : 'text-gray-400'
                                        }`}>
                                            {overId === tierData.tier ? '여기에 드롭하세요' : '아직 추가된 애니가 없습니다'}
                                        </div>
                                    ) : (
                                        <SortableContext
                                            items={tierData.animes.map(anime => anime.id)}
                                            strategy={rectSortingStrategy}
                                        >
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                {tierData.animes.map((anime) => (
                                                    <SortableAnimeCard
                                                        key={anime.id}
                                                        anime={anime}
                                                        isDark={isDark}
                                                        onDelete={() => handleDeleteAnime(tierData.tier, anime.id)}
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    )}
                                </DroppableTierContainer>
                            </div>
                        ))}
                    </div>

                    {/* 드래그 오버레이 */}
                    <DragOverlay>
                        {activeAnime ? (
                            <div className={`rounded-lg overflow-hidden opacity-90 ${
                                isDark ? 'bg-gray-800' : 'bg-gray-100'
                            } shadow-2xl`}>
                                <div className="aspect-[3/4] relative w-32">
                                    <img
                                        src={activeAnime.imageUrl}
                                        alt={activeAnime.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-2">
                                    <p className={`text-sm font-medium truncate ${
                                        isDark ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        {activeAnime.title}
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>

                {/* 저장 버튼 */}
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? '저장 중...' : '저장하기'}
                    </button>
                </div>
            </div>

            {/* 애니 추가 모달 */}
            <AddAnimeModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onAdd={handleAddAnime}
                tierName={selectedTier || ''}
            />
        </div>
    );
}