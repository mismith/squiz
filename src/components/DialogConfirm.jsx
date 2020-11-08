import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

export default function DialogConfirm({
  value,
  title = 'Confirm',
  body = undefined,
  children = 'Are you sure?',
  onCancel = undefined,
  onConfirm = undefined,
  cancelLabel = 'No',
  confirmLabel = 'yes',
  className,
  ...props
}) {
  return (
    <Dialog onClose={onCancel} PaperProps={{ className }} {...props}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography component="div">{body || children}</Typography>
      </DialogContent>
      <DialogActions>
        {Boolean(cancelLabel) && (
          <Button onClick={onCancel}>{cancelLabel}</Button>
        )}
        {Boolean(confirmLabel) && (
          <Button color="primary" onClick={onConfirm}>{confirmLabel}</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
