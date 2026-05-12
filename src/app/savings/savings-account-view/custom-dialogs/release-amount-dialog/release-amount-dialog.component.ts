/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Component, inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

export interface ReleaseAmountDialogData {
  holdAmount: number;
  remainingHoldAmount?: number;
  paymentTypes?: any[];
  maxDate?: Date;
}

@Component({
  selector: 'mifosx-release-amount-dialog',
  templateUrl: './release-amount-dialog.component.html',
  styleUrls: ['./release-amount-dialog.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose
  ]
})
export class ReleaseAmountDialogComponent implements OnInit {
  dialogRef = inject<MatDialogRef<ReleaseAmountDialogComponent>>(MatDialogRef);
  private formBuilder = inject(UntypedFormBuilder);
  private data = inject<ReleaseAmountDialogData>(MAT_DIALOG_DATA);

  releaseForm: UntypedFormGroup;
  holdAmount: number = 0;
  remainingHoldAmount: number = 0;
  paymentTypes: any[] = [];
  maxDate: Date = new Date();

  constructor() {
    if (this.data) {
      this.holdAmount = this.data.holdAmount || 0;
      this.remainingHoldAmount = this.data.remainingHoldAmount ?? this.holdAmount;
      this.paymentTypes = this.data.paymentTypes || [];
      this.maxDate = this.data.maxDate || new Date();
    }
  }

  ngOnInit(): void {
    this.releaseForm = this.formBuilder.group({
      transactionDate: [
        new Date(),
        Validators.required
      ],
      transactionAmount: [
        this.remainingHoldAmount,
        [
          Validators.required,
          Validators.min(0.01),
          Validators.max(this.remainingHoldAmount)
        ]
      ],
      paymentTypeId: ['']
    });
  }

  confirm(): void {
    if (this.releaseForm.valid) {
      this.dialogRef.close({
        confirm: true,
        ...this.releaseForm.value
      });
    }
  }
}
