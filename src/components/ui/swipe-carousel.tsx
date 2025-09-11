import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Pagination } from 'swiper/modules';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface SwipeCarouselProps {
  children: React.ReactNode[];
  onSlideChange?: (index: number) => void;
  selectedIndex?: number;
  className?: string;
}

export const SwipeCarousel = ({ 
  children, 
  onSlideChange, 
  selectedIndex = 0,
  className 
}: SwipeCarouselProps) => {
  const swiperRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);

  useEffect(() => {
    if (swiperRef.current && selectedIndex !== currentIndex) {
      swiperRef.current.slideTo(selectedIndex);
      setCurrentIndex(selectedIndex);
    }
  }, [selectedIndex, currentIndex]);

  const handleSlideChange = (swiper: any) => {
    const newIndex = swiper.activeIndex;
    setCurrentIndex(newIndex);
    onSlideChange?.(newIndex);
  };

  const goToPrevious = () => {
    swiperRef.current?.slidePrev();
  };

  const goToNext = () => {
    swiperRef.current?.slideNext();
  };

  return (
    <div className={cn("relative", className)}>
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={handleSlideChange}
        effect="coverflow"
        coverflowEffect={{
          rotate: 20,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        centeredSlides={true}
        slidesPerView="auto"
        spaceBetween={30}
        initialSlide={selectedIndex}
        modules={[EffectCoverflow, Navigation, Pagination]}
        className="swipe-carousel"
        breakpoints={{
          320: {
            slidesPerView: 1.2,
            spaceBetween: 20,
          },
          640: {
            slidesPerView: 1.5,
            spaceBetween: 30,
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 30,
          },
          1024: {
            slidesPerView: 2.5,
            spaceBetween: 40,
          },
          1280: {
            slidesPerView: 3,
            spaceBetween: 50,
          }
        }}
      >
        {children.map((child, index) => (
          <SwiperSlide key={index} className="!w-auto">
            {child}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation buttons */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
        onClick={goToPrevious}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Previous slide</span>
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
        onClick={goToNext}
      >
        <ArrowRight className="h-4 w-4" />
        <span className="sr-only">Next slide</span>
      </Button>
    </div>
  );
};

export default SwipeCarousel;