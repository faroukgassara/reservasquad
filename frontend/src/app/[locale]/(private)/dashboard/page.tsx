'use client';

import LayoutWrapper from '@/components/Layouts/LayoutWrapper';

export default function ClientPage() {
    return (
        <LayoutWrapper
            title="Dashboard"
            subTitle="Welcome back!"
            mainSection={
                <div className="p-8 bg-gray-50 min-h-full">
                    <div className="max-w-7xl mx-auto">
                        {/* Welcome Header */}
                        <div className="mb-10">
                            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                                Welcome to <span className="text-primary-10">Nexera</span> Dashboard
                            </h1>
                            <p className="mt-2 text-lg text-gray-600">
                                Manage your staff and clients efficiently from one central place.
                            </p>
                        </div>

                        {/* Recent Activity Placeholder */}
                        <div className="mt-12 bg-white rounded-xxl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                            <div className="space-y-6">
                                {[1, 2, 3].map((item) => (
                                    <div key={item} className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                            {item}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-900 font-medium">Staff member assigned to Project Alpha</p>
                                            <p className="text-gray-500 text-sm">2 hours ago</p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-semibold">Updated</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            }
        />
    );
}