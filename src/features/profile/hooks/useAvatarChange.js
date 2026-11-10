import { useDispatch, useSelector } from 'react-redux';
import { showAlert } from '@/services/alerts/alertStore';
import {
  captureAvatar,
  pickAvatar,
  pickerErrorMessage,
} from '@/services/media/photoPicker';
import { changeAvatar } from '@/features/user/store/userSlice';
import { selectProfile } from '@/store/selectors/userSelectors';

// "Change photo": asks camera / gallery / remove, crops to a square and saves it.
// Backing out of the picker is not an error and changes nothing.
export default function useAvatarChange() {
  const dispatch = useDispatch();
  const hasAvatar = Boolean(useSelector(selectProfile)?.avatarUrl);

  const pick = async picker => {
    try {
      const image = await picker();
      if (image) {
        dispatch(changeAvatar(image.uri));
      }
    } catch (e) {
      showAlert('Profile photo', pickerErrorMessage(e), null, {
        tone: 'warning',
        icon: 'camera',
      });
    }
  };

  return () =>
    showAlert(
      'Profile photo',
      'Pick how you want to set your photo.',
      [
        { text: 'Take a photo', onPress: () => pick(captureAvatar) },
        { text: 'Choose from gallery', onPress: () => pick(pickAvatar) },
        ...(hasAvatar
          ? [
              {
                text: 'Remove photo',
                style: 'destructive',
                onPress: () => dispatch(changeAvatar(null)),
              },
            ]
          : []),
        { text: 'Cancel', style: 'cancel' },
      ],
      { icon: 'camera' },
    );
}
