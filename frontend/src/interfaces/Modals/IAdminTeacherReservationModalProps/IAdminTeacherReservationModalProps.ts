type DropdownOption = { value: string | number; label: string };

export default interface IAdminTeacherReservationModalProps {
    teacherOptions: DropdownOption[];
    roomOptions: DropdownOption[];
    startOptions: DropdownOption[];
    endOptions: DropdownOption[];
    bookTeacherId: string;
    bookDate: string;
    bookRoomId: string;
    bookStart: string;
    bookEnd: string;
    bookPeople: number;
    bookPurpose: string;
    roomCapacityMax: number;
    submitting: boolean;
    onTeacherIdChange: (id: string) => void;
    onDateChange: (isoDate: string) => void;
    onRoomIdChange: (roomId: string) => void;
    onStartChange: (time: string) => void;
    onEndChange: (time: string) => void;
    onPeopleChange: (n: number) => void;
    onPurposeChange: (purpose: string) => void;
    onClose: () => void;
    onSubmit: () => void;
}
