package services

import (
	pb_api "api/gen"
	"api/server/lib"
	repositories "api/server/repositories"
	"context"
	"fmt"
	"log"
	"os"
)

type NewsletterService struct {
	dbRepository *repositories.DbRepository
}

func (n *NewsletterService) Init(d *repositories.DbRepository) error {
	// and inject the DbService:
	n.dbRepository = d

	log.Printf("Service: Newsletter service initialized successfully")
	return nil
}

func (n *NewsletterService) SubscribeNewsletter(ctx context.Context, req *pb_api.NewsLetterRequest) (*pb_api.StdResponse, error) {
	ipAddress := lib.GetIPFromContext(ctx)
	userAgent := lib.GetUserAgentFromContext(ctx)
	email := req.GetEmail()

	log.Printf("Subscribing email %s to newsletter from IP %s with User-Agent %s", email, ipAddress, userAgent)

	// TODO - send email to the user inviting them to prism

	// Send notification email to admin:
	err := lib.SendEmail(os.Getenv("EMAIL_ADDRESS"), "New Newsletter Subscription", fmt.Sprintf("Email: %s\nIP Address: %s\nUser-Agent: %s", email, ipAddress, userAgent))
	if err != nil {
		log.Printf("Failed to send notification email: %v", err)
		return nil, fmt.Errorf("failed to send notification email: %v", "internal error" /* err - don't pass the full reason to the user*/)
	}

	err = n.dbRepository.CreateNewsletterSubscription(email, ipAddress, userAgent)
	if err != nil {
		return &pb_api.StdResponse{
			Message:   "Failed to subscribe to newsletter",
			ErrorCode: 1,
		}, fmt.Errorf("failed to create newsletter subscription: %v", "internal error" /* err - don't pass the full reason to the user*/)
	}

	return &pb_api.StdResponse{
		Message: "Successfully subscribed to newsletter",
	}, nil
}
