export type CalendarReservation = {
    id: string;
    userId: string;
    roomId: string;
    date: string;
    startMinutes: number;
    endMinutes: number;
    startTime: string;
    endTime: string;
    numberOfPeople: number;
    purpose: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
    user: { id: string; name: string; email: string };
    room: { id: string; name: string; capacity: number; color: string; equipment: string[] };
};

export type ReservationRoom = {
    id: string;
    name: string;
    capacity: number;
    color: string;
    equipment: string[];
};

export type TeacherOption = { id: string; name: string };

export type CalendarPayload = {
    from: string;
    to: string;
    byDay: Record<string, CalendarReservation[]>;
};
