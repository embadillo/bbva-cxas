import blackAllImage from '../../assets/brand/black-all.png';
import blackSaveImage from '../../assets/brand/black-save.png';
import blackTravelImage from '../../assets/brand/black-travel.png';
import platinumVisaImage from '../../assets/brand/promo_slider_platinum-visa.im1761854278865im.png';

const localCardImages = {
  'bbva-black-plus-all': blackAllImage,
  'bbva-black-plus-save': blackSaveImage,
  'bbva-black-plus-travel': blackTravelImage,
  'bbva-visa-platinum': platinumVisaImage,
  'bbva-package-platinum': platinumVisaImage,
};

function isHttpUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getCardImage(productId, imageUris = []) {
  return localCardImages[productId] || imageUris.find(isHttpUrl) || null;
}

export { localCardImages };
