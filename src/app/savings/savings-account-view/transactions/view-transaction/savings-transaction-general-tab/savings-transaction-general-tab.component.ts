/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Dates } from 'app/core/utils/dates';
import {
  ReleaseAmountDialogComponent,
  ReleaseAmountDialogData
} from 'app/savings/savings-account-view/custom-dialogs/release-amount-dialog/release-amount-dialog.component';
import { UndoTransactionDialogComponent } from 'app/savings/savings-account-view/custom-dialogs/undo-transaction-dialog/undo-transaction-dialog.component';
import { SavingsService } from 'app/savings/savings.service';
import { SettingsService } from 'app/settings/settings.service';
import { NgClass, CurrencyPipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TransactionPaymentDetailComponent } from '../../../../../shared/transaction-payment-detail/transaction-payment-detail.component';
import { DateFormatPipe } from '../../../../../pipes/date-format.pipe';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { AlertService } from 'app/core/alert/alert.service';

@Component({
  selector: 'mifosx-savings-transaction-general-tab',
  templateUrl: './savings-transaction-general-tab.component.html',
  styleUrls: ['./savings-transaction-general-tab.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    FaIconComponent,
    NgClass,
    TransactionPaymentDetailComponent,
    CurrencyPipe,
    DateFormatPipe
  ]
})
export class SavingsTransactionGeneralTabComponent {
  private savingsService = inject(SavingsService);
  private route = inject(ActivatedRoute);
  private dateUtils = inject(Dates);
  private router = inject(Router);
  dialog = inject(MatDialog);
  private settingsService = inject(SettingsService);
  private alertService = inject(AlertService);

  accountId: string;
  transactionId: string;
  transactionData: any;

  constructor() {
    this.route.data.subscribe((data: { savingsAccountTransaction: any }) => {
      this.accountId = this.route.parent.snapshot.params['savingAccountId'];
      this.transactionData = data.savingsAccountTransaction;
    });
  }

  allowUndo(): boolean {
    if (this.transactionData.reversed && this.transactionData.transactionType.amountHold) {
      return false;
    }
    return !this.transactionData.reversed;
  }

  releaseAmount(): void {
    const dialogData: ReleaseAmountDialogData = {
      holdAmount: this.transactionData.amount,
      remainingHoldAmount: this.transactionData.remainingHoldAmount ?? this.transactionData.amount,
      paymentTypes: this.transactionData.paymentTypeOptions || [],
      maxDate: this.settingsService.businessDate
    };

    const releaseAmountDialogRef = this.dialog.open(ReleaseAmountDialogComponent, {
      data: dialogData,
      width: '400px'
    });

    releaseAmountDialogRef.afterClosed().subscribe((response: any) => {
      if (response?.confirm) {
        const locale = this.settingsService.language.code;
        const dateFormat = this.settingsService.dateFormat;
        const data: any = {
          transactionDate: this.dateUtils.formatDate(response.transactionDate, dateFormat),
          transactionAmount: response.transactionAmount,
          dateFormat,
          locale
        };

        if (response.paymentTypeId) {
          data.paymentTypeId = response.paymentTypeId;
        }

        this.savingsService
          .executeSavingsAccountTransactionsCommand(this.accountId, 'releaseAmount', data, this.transactionData.id)
          .subscribe({
            next: (result: any) => {
              // Handle new response format with changes object
              const changes = result?.changes || {};
              const releaseTransactionId = changes.releaseTransactionId ?? result?.resourceId;
              const withdrawalTransactionId = changes.withdrawalTransactionId;

              if (withdrawalTransactionId) {
                this.alertService.alert({
                  type: 'Release Amount Success',
                  message: `Amount released successfully. Release ID: ${releaseTransactionId}, Withdrawal ID: ${withdrawalTransactionId}`
                });
              }

              this.router.navigate(['../..'], { relativeTo: this.route });
            },
            error: (error: any) => {
              // Error will be handled by the global error handler interceptor
              console.error('Release amount error:', error);
            }
          });
      }
    });
  }

  undoTransaction(): void {
    const undoTransactionAccountDialogRef = this.dialog.open(UndoTransactionDialogComponent);
    undoTransactionAccountDialogRef.afterClosed().subscribe((response: any) => {
      if (response.confirm) {
        const locale = this.settingsService.language.code;
        const dateFormat = this.settingsService.dateFormat;
        const data = {
          transactionDate: this.dateUtils.formatDate(
            this.transactionData.date && new Date(this.transactionData.date),
            dateFormat
          ),
          transactionAmount: 0,
          dateFormat,
          locale
        };
        this.savingsService
          .executeSavingsAccountTransactionsCommand(this.accountId, 'undo', data, this.transactionData.id)
          .subscribe(() => {
            this.router.navigate(['../..'], { relativeTo: this.route });
          });
      }
    });
  }

  transactionColor(): string {
    if (this.transactionData.reversed) {
      return 'undo';
    }
    return 'active';
  }
}
