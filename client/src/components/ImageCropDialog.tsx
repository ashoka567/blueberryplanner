import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';

interface ImageCropDialogProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
}

type PhotoSize = 'small' | 'medium' | 'large';

const PHOTO_SIZES: Record<PhotoSize, { width: number; height: number; label: string }> = {
  small: { width: 100, height: 100, label: 'Small (100x100)' },
  medium: { width: 200, height: 200, label: 'Medium (200x200)' },
  large: { width: 300, height: 300, label: 'Large (300x300)' },
};

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  outputSize: { width: number; height: number }
): Promise<string> {
  const image = new Image();
  image.src = imageSrc;
  
  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  canvas.width = outputSize.width;
  canvas.height = outputSize.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize.width,
    outputSize.height
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}

export default function ImageCropDialog({
  open,
  onClose,
  imageSrc,
  onCropComplete,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [photoSize, setPhotoSize] = useState<PhotoSize>('medium');
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteCallback = useCallback(
    (_: any, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        PHOTO_SIZES[photoSize]
      );
      onCropComplete(croppedImage);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setPhotoSize('medium');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="crop-description">
        <DialogHeader>
          <DialogTitle>Crop Your Photo</DialogTitle>
        </DialogHeader>
        <p id="crop-description" className="sr-only">Adjust the crop area and select a size for your profile photo</p>
        
        <div className="space-y-6">
          <div className="relative h-64 w-full bg-gray-900 rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropCompleteCallback}
              onZoomChange={setZoom}
              cropShape="round"
              showGrid={false}
            />
          </div>

          <div className="space-y-2">
            <Label>Zoom</Label>
            <Slider
              value={[zoom]}
              onValueChange={(values) => setZoom(values[0])}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
              data-testid="slider-zoom"
            />
          </div>

          <div className="space-y-2">
            <Label>Photo Size</Label>
            <RadioGroup
              value={photoSize}
              onValueChange={(value) => setPhotoSize(value as PhotoSize)}
              className="flex flex-col gap-2"
            >
              {Object.entries(PHOTO_SIZES).map(([key, { label }]) => (
                <div key={key} className="flex items-center space-x-2">
                  <RadioGroupItem value={key} id={`size-${key}`} data-testid={`radio-size-${key}`} />
                  <Label htmlFor={`size-${key}`} className="font-normal cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} data-testid="button-cancel-crop">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isProcessing}
            className="bg-[#D2691E] hover:bg-[#B8581A]"
            data-testid="button-save-crop"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Save Photo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
