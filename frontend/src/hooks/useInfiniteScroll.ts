import { useEffect, RefObject } from 'react';

const useInfiniteScroll = (callback: Function, loaderRef: RefObject<HTMLElement>) => {
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const target = entries[0];
            if (target.isIntersecting) {
                callback();
            }
        });

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [callback, loaderRef]);
};

export default useInfiniteScroll;
