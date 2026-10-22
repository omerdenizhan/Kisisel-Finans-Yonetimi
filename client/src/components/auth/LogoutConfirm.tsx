import { LogOut } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
interface Props {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}
export function LogoutConfirm({ open, onCancel, onConfirm }: Props) {
    return (
        <Modal
            open={open}
            onClose={onCancel}
            title="Çıkış Yap"
            description="Oturumunuz sonlandırılacak ve giriş ekranına yönlendirileceksiniz."
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onCancel}>Vazgeç</Button>
                    <Button variant="danger" leftIcon={<LogOut className="h-4 w-4" />} onClick={onConfirm} autoFocus>Çıkış Yap</Button>
                </>
            } >
            <p className="text-sm text-slate-600 dark:text-slate-300">Çıkış yapmak istediğinizden emin misiniz?</p>
        </Modal>
    );
}
