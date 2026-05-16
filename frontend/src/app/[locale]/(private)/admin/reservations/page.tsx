'use client';

import AtomBadge from '@/components/Atoms/AtomBadge/AtomBadge';
import AtomButton from '@/components/Atoms/AtomButton/AtomButton';
import type { CalendarReservation } from '@/types/calendar';
import type { IMoleculeTableColumn } from '@/interfaces/Molecules/IMoleculeTableColumn/IMoleculeTableColumn';
import { ApiError, backendFetch } from '@/lib/reservasquad-api';
import { startTimeOptions, validEndsForStart } from '@/lib/time-slots';
import { EBadgeColor, EBadgeSize, EButtonType, EVariantLabel } from '@/Enum/Enum';
import { useSession } from 'next-auth/react';
import { format, parseISO } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import MoleculeDropdown from '@/components/Molecules/MoleculeDropdown/MoleculeDropdown';
import AdminTeacherReservationModal from '@/components/Modals/AdminTeacherReservationModal/AdminTeacherReservationModal';
import OrganismTable from '@/components/Organisms/OrganismTable/OrganismTable';
import { useModal } from '@/contexts/ModalContext';

type AdminReservationTableRow = {
    reservation: CalendarReservation;
    sortDate: string;
    dateDisplay: string;
    slot: string;
    roomName: string;
    requester: string;
    places: number;
    motif: string;
    statusLabel: string;
};

type Room = { id: string; name: string; capacity: number; color: string; equipment: string[] };
type Teacher = { id: string; name: string; email: string };

function reservationStatusBadge(status: CalendarReservation['status']): EBadgeColor {
    if (status === 'CONFIRMED') return EBadgeColor.success;
    if (status === 'PENDING') return EBadgeColor.warning;
    return EBadgeColor.danger;
}

export default function AdminReservationsPage() {
    const { data: session, status } = useSession();
    const token = session?.accessToken;
    const role = session?.user?.role;
    const [rows, setRows] = useState<CalendarReservation[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [roomId, setRoomId] = useState('');
    const [stat, setStat] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('ALL');
    const [loading, setLoading] = useState(true);
    const { openModal, closeModal, modalPortal } = useModal();
    const [bookTeacherId, setBookTeacherId] = useState('');
    const [bookDate, setBookDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [bookRoomId, setBookRoomId] = useState('');
    const [bookStart, setBookStart] = useState(startTimeOptions()[0]);
    const [bookEnd, setBookEnd] = useState(validEndsForStart(startTimeOptions()[0])[0] ?? '00:00');
    const [bookPeople, setBookPeople] = useState(1);
    const [bookPurpose, setBookPurpose] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const roomFilterOptions = useMemo(
        () => [{ value: '', label: 'Toutes les salles' }, ...rooms.map((r) => ({ value: r.id, label: r.name }))],
        [rooms],
    );

    const statFilterOptions = useMemo(
        () => [
            { value: 'ALL', label: 'Tous statuts' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'CONFIRMED', label: 'Confirmées' },
            { value: 'CANCELLED', label: 'Annulées' },
        ],
        [],
    );

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const parts: string[] = [];
            if (roomId) parts.push(`roomId=${encodeURIComponent(roomId)}`);
            if (stat !== 'ALL') parts.push(`status=${encodeURIComponent(stat)}`);
            const suffix = parts.length ? `?${parts.join('&')}` : '';
            const list = await backendFetch<CalendarReservation[]>(token, `/reservations${suffix}`);
            setRows(Array.isArray(list) ? list : []);
        } catch {
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [token, roomId, stat]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        if (!token || role !== 'ADMIN') return;
        void backendFetch<Room[]>(token, '/rooms')
            .then((r) => {
                const list = Array.isArray(r) ? r : [];
                setRooms(list);
                setBookRoomId((prev) => prev || list[0]?.id || '');
            })
            .catch(() => []);
        void backendFetch<Teacher[]>(token, '/directory/teachers')
            .then((t) => {
                const list = Array.isArray(t) ? t : [];
                setTeachers(list);
                setBookTeacherId((prev) => prev || list[0]?.id || '');
            })
            .catch(() => []);
    }, [token, role]);

    useEffect(() => {
        const allowed = validEndsForStart(bookStart);
        setBookEnd((prev) => (allowed.includes(prev) ? prev : allowed.at(-1) ?? '00:00'));
    }, [bookStart]);

    const patch = useCallback(
        async (id: string, next: 'CONFIRMED' | 'CANCELLED') => {
            if (!token) return;
            try {
                await backendFetch(token, `/reservations/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: next }),
                });
                await load();
            } catch (e) {
                alert(e instanceof ApiError ? e.message : 'Erreur');
            }
        },
        [token, load],
    );

    const tableRows: AdminReservationTableRow[] = useMemo(
        () =>
            rows.map((r) => ({
                reservation: r,
                sortDate: String(r.date).slice(0, 10),
                dateDisplay: format(parseISO(String(r.date).slice(0, 10)), 'dd/MM/yyyy'),
                slot: `${r.startTime} – ${r.endTime}`,
                roomName: r.room.name,
                requester: r.user.name,
                places: r.numberOfPeople,
                motif: r.purpose,
                statusLabel: r.status,
            })),
        [rows],
    );

    const reservationColumns = useMemo<IMoleculeTableColumn<AdminReservationTableRow>[]>(
        () => [
            {
                headerElement: {
                    value: 'sortDate',
                    label: 'Date',
                    sortable: true,
                    headerClassName: 'uppercase text-xs',
                    render: (_v, row) => row.dateDisplay,
                },
            },
            {
                headerElement: {
                    value: 'slot',
                    label: 'Créneau',
                    sortable: true,
                    headerClassName: 'uppercase text-xs',
                },
            },
            {
                headerElement: {
                    value: 'roomName',
                    label: 'Salle',
                    sortable: true,
                    headerClassName: 'uppercase text-xs',
                    render: (_, row) => (
                        <AtomDiv
                            className="inline-flex max-w-[12rem] rounded px-2 py-0.5"
                            style={{ borderLeft: `3px solid ${row.reservation.room.color}` }}
                        >
                            <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900" className="truncate">
                                {row.roomName}
                            </AtomLabel>
                        </AtomDiv>
                    ),
                },
            },
            {
                headerElement: {
                    value: 'requester',
                    label: 'Demandeur',
                    sortable: true,
                    headerClassName: 'uppercase text-xs',
                    render: (_, row) => (
                        <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900" className="max-w-[10rem] truncate">
                            {row.requester}
                        </AtomLabel>
                    ),
                },
            },
            {
                headerElement: {
                    value: 'places',
                    label: 'Places',
                    sortable: true,
                    headerClassName: 'uppercase text-xs',
                },
            },
            {
                headerElement: {
                    value: 'motif',
                    label: 'Motif',
                    sortable: true,
                    headerClassName: 'uppercase text-xs',
                    render: (_, row) => (
                        <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900" className="max-w-[12rem] truncate">
                            {row.motif}
                        </AtomLabel>
                    ),
                },
            },
            {
                headerElement: {
                    value: 'statusLabel',
                    label: 'Statut',
                    sortable: true,
                    headerClassName: 'uppercase text-xs',
                    render: (_, row) => (
                        <AtomBadge
                            text={row.reservation.status}
                            size={EBadgeSize.small}
                            color={reservationStatusBadge(row.reservation.status)}
                        />
                    ),
                },
            },
            {
                headerElement: {
                    value: '_actionsPlaceholder',
                    label: 'Actions',
                    sortable: false,
                    headerClassName: 'uppercase text-xs',
                    render: (_, row) =>
                        row.reservation.status === 'PENDING' ?
                            <AtomDiv className="flex flex-wrap gap-1 py-2">
                                <AtomButton
                                    id={`admin-confirm-${row.reservation.id}`}
                                    type={EButtonType.primary}
                                    className="rounded! px-2! py-1! text-[11px]! text-white!"
                                    style={{ backgroundColor: '#059669' }}
                                    onClick={() => void patch(row.reservation.id, 'CONFIRMED')}
                                    text="Confirmer"
                                />
                                <AtomButton
                                    id={`admin-refuse-${row.reservation.id}`}
                                    type={EButtonType.primary}
                                    className="rounded! px-2! py-1! text-[11px]! text-white!"
                                    style={{ backgroundColor: '#dc2626' }}
                                    onClick={() => void patch(row.reservation.id, 'CANCELLED')}
                                    text="Refuser"
                                />
                            </AtomDiv>
                        :   <AtomLabel variant={EVariantLabel.caption} color="text-gray-400">
                                —
                            </AtomLabel>,
                },
            },
        ],
        [patch],
    );

    const adminSubmit = async () => {
        if (!token) return;
        setSubmitting(true);
        try {
            await backendFetch(token, '/reservations/admin', {
                method: 'POST',
                body: JSON.stringify({
                    teacherUserId: bookTeacherId,
                    roomId: bookRoomId,
                    date: bookDate,
                    startTime: bookStart,
                    endTime: bookEnd,
                    numberOfPeople: bookPeople,
                    purpose: bookPurpose.trim(),
                }),
            });
            closeModal();
            setBookPurpose('');
            await load();
        } catch (err) {
            alert(err instanceof ApiError ? err.message : 'Erreur');
        } finally {
            setSubmitting(false);
        }
    };

    const teacherModalOptions = useMemo(
        () => teachers.map((t) => ({ value: t.id, label: `${t.name} (${t.email})` })),
        [teachers],
    );
    const roomModalOptions = useMemo(
        () => rooms.map((r) => ({ value: r.id, label: r.name })),
        [rooms],
    );
    const startModalOptions = useMemo(() => startTimeOptions().map((t) => ({ value: t, label: t })), []);
    const endModalOptions = useMemo(
        () => validEndsForStart(bookStart).map((t) => ({ value: t, label: t })),
        [bookStart],
    );

    if (role !== 'ADMIN') {
        return (
            <AtomDiv className="p-8">
                <AtomLabel variant={EVariantLabel.body} color="text-gray-600">
                    Accès réservé aux administrateurs.
                </AtomLabel>
            </AtomDiv>
        );
    }

    if (status === 'loading' || status === 'unauthenticated') {
        return null;
    }

    const capacity = rooms.find((r) => r.id === bookRoomId)?.capacity ?? 99;

    return (
        <AtomDiv className="p-4 lg:p-8">
            <AtomDiv className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <AtomLabel variant={EVariantLabel.h3} color="text-primary-900" className="font-semibold">
                    Réservations (admin)
                </AtomLabel>
                <AtomButton
                    id="admin-reservations-create"
                    type={EButtonType.primary}
                    className="font-semibold text-white bg-accent-500"
                    onClick={() => openModal()}
                    text="Créer pour un professeur"
                />
            </AtomDiv>

            <AtomDiv className="mb-4 flex flex-wrap gap-3">
                <AtomDiv className="min-w-[200px] flex-1 sm:flex-initial sm:min-w-[220px]">
                    <MoleculeDropdown
                        placeholder="Filtrer par salle"
                        options={roomFilterOptions}
                        value={roomId}
                        onChange={(v) => setRoomId(String(Array.isArray(v) ? v[0] ?? '' : v))}
                    />
                </AtomDiv>
                <AtomDiv className="min-w-[200px] flex-1 sm:flex-initial sm:min-w-[200px]">
                    <MoleculeDropdown
                        placeholder="Statut"
                        options={statFilterOptions}
                        value={stat}
                        onChange={(v) =>
                            setStat((Array.isArray(v) ? v[0] : v) as typeof stat)
                        }
                    />
                </AtomDiv>
                <AtomButton
                    id="admin-reservations-refresh"
                    type={EButtonType.secondary}
                    className="self-end px-3! py-2! text-sm"
                    onClick={() => void load()}
                    text="Actualiser"
                />
            </AtomDiv>

            <OrganismTable<AdminReservationTableRow>
                badge={null}
                columns={reservationColumns}
                emptyMessage="Aucune réservation."
                isLoading={loading}
                pageSize={100}
                rows={tableRows}
                searchable={false}
                tableClassName="text-sm"
            />

            {modalPortal(
                <AdminTeacherReservationModal
                    teacherOptions={teacherModalOptions}
                    roomOptions={roomModalOptions}
                    startOptions={startModalOptions}
                    endOptions={endModalOptions}
                    bookTeacherId={bookTeacherId}
                    bookDate={bookDate}
                    bookRoomId={bookRoomId}
                    bookStart={bookStart}
                    bookEnd={bookEnd}
                    bookPeople={bookPeople}
                    bookPurpose={bookPurpose}
                    roomCapacityMax={capacity}
                    submitting={submitting}
                    onTeacherIdChange={setBookTeacherId}
                    onDateChange={setBookDate}
                    onRoomIdChange={setBookRoomId}
                    onStartChange={setBookStart}
                    onEndChange={setBookEnd}
                    onPeopleChange={setBookPeople}
                    onPurposeChange={setBookPurpose}
                    onClose={closeModal}
                    onSubmit={adminSubmit}
                />,
            )}
        </AtomDiv>
    );
}
