import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

export default ({
  value,
  title = 'Confirm',
  body = 'Are you sure?',
  onCancel = undefined,
  onConfirm = undefined,
  cancelLabel = 'No',
  confirmLabel = 'yes',
  ...props
}) => {
  return (
    <Dialog onClose={onCancel} {...props}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{body}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{cancelLabel}</Button>
        <Button color="primary" onClick={onConfirm}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
};
