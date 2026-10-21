'use client';

import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import Button from '@/components/Primitives/Button/Button';
import { EButtonSize, EButtonType, ESize, EVariantLabel, IconComponentsEnum } from '@/Enum/Enum';
import { IOrganismTopSection } from '@/interfaces';
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import { useTranslations } from 'next-intl';
import ThemeToggle from '@/components/Primitives/ThemeToggle/ThemeToggle';
import NotificationBell from '@/components/Organisms/Notifications/NotificationBell';

const OrganismTopSection = (props: IOrganismTopSection) => {
    const mobileSidebar = useMobileSidebar();
    const t = useTranslations('sidebar');

    return (
        <header className="sticky top-0 z-30 flex flex-col gap-4 border-b border-gray-100 bg-white px-4 py-4 sm:px-6 tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-6 lg:px-8 lg:py-5">
            <Div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
                {mobileSidebar && (
                    <Button
                        id="mobile-sidebar-open"
                        type={EButtonType.tertiary}
                        size={EButtonSize.medium}
                        iconPosition="only"
                        icon={{
                            name: IconComponentsEnum.menu,
                            size: ESize.md,
                            color: 'text-primary-500',
                        }}
                        onClick={mobileSidebar.openSidebar}
                        aria-label={t('openMenu')}
                        className="mt-0.5 shrink-0 border-none bg-gray-100 hover:bg-gray-100 hover:opacity-70 lg:hidden"
                    />
                )}
                {props?.leftActions}
                <Div className="flex min-w-0 flex-1 flex-col">
                    <Label variant={EVariantLabel.h6} color="text-primary-500" className="truncate">
                        {props?.title}
                    </Label>
                    {props?.subTitle && (
                        <Label
                            variant={EVariantLabel.bodySmall}
                            color="text-gray-500"
                            className="line-clamp-2 sm:line-clamp-1"
                        >
                            {props?.subTitle}
                        </Label>
                    )}
                </Div>
                <NotificationBell />
                <ThemeToggle />
            </Div>

            {props?.rightActions && (
                <Div className="flex w-full min-w-0 flex-wrap items-center gap-2 *:flex-1 tablet:w-auto tablet:justify-end tablet:gap-4 tablet:*:flex-none">
                    {props.rightActions}
                </Div>
            )}
        </header>
    );
};

export default OrganismTopSection;
