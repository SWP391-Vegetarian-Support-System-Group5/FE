-- Apply only to the database configured for the backend API.
-- Uses the existing backend schema; no application rows are inserted or deleted.
-- Does not alter existing tables or replace existing allergen selections.
SELECT DATABASE() AS target_database;

CREATE TABLE IF NOT EXISTS `AllergenSubmissions` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `UserId` int NOT NULL,
  `SubmittedName` varchar(80) NOT NULL,
  `Name` varchar(80) NOT NULL,
  `Status` varchar(20) NOT NULL,
  `PendingKey` varchar(200) NULL,
  `SubmittedPendingKey` varchar(200) NULL,
  `RejectionReason` varchar(1000) NULL,
  `AllergenId` int NULL,
  `ReviewedByUserId` int NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `ReviewedAt` datetime(6) NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_AllergenSubmissions_PendingKey` (`PendingKey`),
  UNIQUE KEY `IX_AllergenSubmissions_SubmittedPendingKey` (`SubmittedPendingKey`),
  KEY `IX_AllergenSubmissions_Status_CreatedAt` (`Status`, `CreatedAt`),
  KEY `IX_AllergenSubmissions_UserId` (`UserId`),
  KEY `IX_AllergenSubmissions_ReviewedByUserId` (`ReviewedByUserId`),
  KEY `IX_AllergenSubmissions_AllergenId` (`AllergenId`),
  CONSTRAINT `FK_AllergenSubmissions_Users` FOREIGN KEY (`UserId`) REFERENCES `Users` (`UserId`) ON DELETE CASCADE,
  CONSTRAINT `FK_AllergenSubmissions_Reviewer` FOREIGN KEY (`ReviewedByUserId`) REFERENCES `Users` (`UserId`) ON DELETE SET NULL,
  CONSTRAINT `FK_AllergenSubmissions_Allergens` FOREIGN KEY (`AllergenId`) REFERENCES `Allergens` (`AllergenId`) ON DELETE SET NULL,
  CONSTRAINT `CK_AllergenSubmissions_Status` CHECK (`Status` IN ('PENDING','APPROVED','REJECTED')),
  CONSTRAINT `CK_AllergenSubmissions_RejectionReason` CHECK (`Status` <> 'REJECTED' OR CHAR_LENGTH(TRIM(COALESCE(`RejectionReason`, ''))) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Verify every column read by the failing endpoint, without reading personal data.
SELECT `Id`, `UserId`, `SubmittedName`, `Name`, `Status`, `PendingKey`,
       `SubmittedPendingKey`, `RejectionReason`, `AllergenId`,
       `ReviewedByUserId`, `CreatedAt`, `ReviewedAt`
FROM `AllergenSubmissions` WHERE 1 = 0;
